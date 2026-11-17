import { PAGE } from './page.js';

export const KINDS = ['error', 'rerouted', 'slow', 'unexpected', 'capped'];
export const KEEP_DAYS = 14;
export const PER_MINUTE = 100; // rows a minute per app: a storm of errors cannot fill D1
const FIELDS = ['route', 'kind', 'why', 'expected', 'actual', 'model', 'effort', 'ms', 'status', 'detail'];
// Anything that could carry a person's words or secrets is refused, not stored.
const FORBIDDEN = /^(prompt|prompts|answer|messages?|content|text|key|token|secret|password|login|email|body)$/i;

const json = (status, body) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' } });
const cut = (v, n) => (v == null ? null : String(v).slice(0, n));
const num = (v) => (Number.isFinite(Number(v)) && v !== null && v !== '' ? Math.round(Number(v)) : null);

// "chat:abc,inference:def" -> the app a key belongs to, or null.
export function appForKey(env, given) {
  if (!given) return null;
  for (const pair of String(env.TRACE_KEYS || '').split(',')) {
    const i = pair.indexOf(':');
    if (i > 0 && pair.slice(i + 1) === given) return pair.slice(0, i).trim();
  }
  return null;
}

// Checks one event. Returns { event } or { error }.
export function validate(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return { error: 'send a JSON object' };
  for (const k of Object.keys(body)) {
    if (FORBIDDEN.test(k)) return { error: `field "${k}" is never stored` };
    if (!FIELDS.includes(k)) return { error: `unknown field "${k}"` };
  }
  if (!KINDS.includes(body.kind)) return { error: `kind must be one of ${KINDS.join(', ')}` };
  if (!body.route || !body.why) return { error: 'route and why are required' };
  return {
    event: {
      route: cut(body.route, 120),
      kind: body.kind,
      why: cut(body.why, 200),
      expected: cut(body.expected, 120),
      actual: cut(body.actual, 200),
      model: cut(body.model, 80),
      effort: cut(body.effort, 20),
      ms: num(body.ms),
      status: num(body.status),
      detail: cut(body.detail, 200),
    },
  };
}

const hits = new Map(); // per isolate: app -> { minute, n }
export function overLimit(app, now = Date.now(), limit = PER_MINUTE) {
  const minute = Math.floor(now / 60000);
  const h = hits.get(app);
  if (!h || h.minute !== minute) { hits.set(app, { minute, n: 1 }); return false; }
  h.n++;
  return h.n > limit;
}
export const resetLimits = () => hits.clear();

// Same app, route, kind and reason inside a minute is one row with a count.
export async function record(env, app, e, now = new Date()) {
  const at = now.toISOString();
  const since = new Date(now.getTime() - 60000).toISOString();
  const same = await env.DB.prepare('SELECT id FROM traces WHERE app = ? AND route = ? AND kind = ? AND why = ? AND last >= ? ORDER BY id DESC LIMIT 1').bind(app, e.route, e.kind, e.why, since).first();
  if (same) {
    await env.DB.prepare('UPDATE traces SET n = n + 1, last = ? WHERE id = ?').bind(at, same.id).run();
    return { merged: true };
  }
  await env.DB.prepare('INSERT INTO traces (created, app, route, kind, why, expected, actual, model, effort, ms, status, detail, n, last) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)')
    .bind(at, app, e.route, e.kind, e.why, e.expected, e.actual, e.model, e.effort, e.ms, e.status, e.detail, at)
    .run();
  return { merged: false };
}

export async function cleanup(env, now = new Date()) {
  const before = new Date(now.getTime() - KEEP_DAYS * 86400000).toISOString();
  await env.DB.prepare('DELETE FROM traces WHERE created < ?').bind(before).run();
}

// GET /api/events?days=7&app=chat&kind=rerouted with Authorization: Bearer <ADMIN_KEY>
export async function events(request, env) {
  const key = env.ADMIN_KEY || '';
  const given = (request.headers.get('authorization') || '').replace(/^Bearer /, '');
  if (!key || given !== key) return json(404, { error: 'not found' });
  const q = new URL(request.url).searchParams;
  const days = Math.min(KEEP_DAYS, Math.max(1, Number(q.get('days')) || 7));
  const since = new Date(Date.now() - days * 86400000).toISOString();
  const where = ['created >= ?'];
  const args = [since];
  if (q.get('app')) { where.push('app = ?'); args.push(q.get('app')); }
  if (KINDS.includes(q.get('kind'))) { where.push('kind = ?'); args.push(q.get('kind')); }
  const rows = await env.DB.prepare(`SELECT id, created, last, app, route, kind, why, expected, actual, model, effort, ms, status, detail, n FROM traces WHERE ${where.join(' AND ')} ORDER BY id DESC LIMIT 100`).bind(...args).all();
  const totals = await env.DB.prepare('SELECT app, kind, SUM(n) AS events FROM traces WHERE created >= ? GROUP BY app, kind ORDER BY events DESC').bind(since).all();
  return json(200, { days, totals: totals.results, events: rows.results });
}

export async function ingest(request, env) {
  const app = appForKey(env, (request.headers.get('authorization') || '').replace(/^Bearer /, ''));
  if (!app) return json(401, { error: 'bad key' });
  if (overLimit(app)) return json(429, { error: 'too many traces this minute' });
  let body = null;
  try { body = JSON.parse((await request.text()) || '{}'); } catch { /* falls to validate */ }
  const v = validate(body);
  if (v.error) return json(400, { error: v.error });
  return json(200, { ok: true, ...(await record(env, app, v.event)) });
}

export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url);
    if (pathname === '/v1/trace' && request.method === 'POST') return ingest(request, env);
    if (pathname === '/api/events' && request.method === 'GET') return events(request, env);
    if (pathname === '/' && request.method === 'GET') return new Response(PAGE, { headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store', 'x-content-type-options': 'nosniff', 'content-security-policy': "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; connect-src 'self'" } });
    return json(404, { error: 'not found' });
  },
  async scheduled(_event, env) {
    await cleanup(env);
  },
};
