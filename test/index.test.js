import { test, expect, beforeEach } from 'bun:test';
import { Database } from 'bun:sqlite';
import { readFileSync } from 'node:fs';
import worker, { appForKey, validate, overLimit, resetLimits, record, cleanup, KEEP_DAYS } from '../src/index.js';

// A D1-shaped wrapper over a real SQLite database that runs the real schema.sql.
function d1() {
  const db = new Database(':memory:');
  db.exec(readFileSync(new URL('../schema.sql', import.meta.url), 'utf8'));
  return {
    raw: db,
    prepare: (sql) => ({
      bind: (...a) => ({
        run: async () => db.prepare(sql).run(...a),
        first: async () => db.prepare(sql).get(...a) ?? null,
        all: async () => ({ results: db.prepare(sql).all(...a) }),
      }),
    }),
  };
}
const env = () => ({ DB: d1(), TRACE_KEYS: 'chat:ck, inference:ik', ADMIN_KEY: 'adm' });
const post = (e, key, body) => worker.fetch(new Request('https://t/v1/trace', { method: 'POST', headers: { authorization: `Bearer ${key}` }, body: JSON.stringify(body) }), e);
const ev = { route: '/api/ask', kind: 'rerouted', why: 'Wolf 429, OpenRouter answered', expected: 'wolf', actual: 'wolf:429>openrouter:ok' };
beforeEach(resetLimits);

test('a key belongs to one app, a wrong key to none', () => {
  const e = env();
  expect(appForKey(e, 'ck')).toBe('chat');
  expect(appForKey(e, 'ik')).toBe('inference');
  expect(appForKey(e, 'nope')).toBe(null);
  expect(appForKey(e, '')).toBe(null);
});

test('prompts, answers, keys and logins are refused, not stored', () => {
  for (const f of ['prompt', 'answer', 'messages', 'content', 'key', 'login', 'email']) {
    expect(validate({ ...ev, [f]: 'x' }).error).toContain('never stored');
  }
  expect(validate({ ...ev, surprise: 1 }).error).toContain('unknown field');
  expect(validate({ ...ev, kind: 'fine' }).error).toContain('kind must be');
  expect(validate({ kind: 'error' }).error).toContain('required');
});

test('long text is cut', () => {
  const { event } = validate({ ...ev, why: 'w'.repeat(900), detail: 'd'.repeat(900) });
  expect(event.why.length).toBe(200);
  expect(event.detail.length).toBe(200);
});

test('ingest needs a valid key', async () => {
  expect((await post(env(), 'bad', ev)).status).toBe(401);
  expect((await post(env(), 'ck', { ...ev, prompt: 'hi' })).status).toBe(400);
});

test('an event is stored under the app of its key', async () => {
  const e = env();
  expect((await post(e, 'ik', ev)).status).toBe(200);
  const row = e.DB.raw.prepare('SELECT * FROM traces').get();
  expect(row.app).toBe('inference');
  expect(row.kind).toBe('rerouted');
  expect(row.actual).toBe('wolf:429>openrouter:ok');
  expect(row.n).toBe(1);
});

test('the same event inside a minute is one row with a count', async () => {
  const e = env();
  await post(e, 'ck', ev);
  await post(e, 'ck', ev);
  await post(e, 'ck', ev);
  const rows = e.DB.raw.prepare('SELECT n FROM traces').all();
  expect(rows).toEqual([{ n: 3 }]);
});

test('a different reason, kind or app is its own row', async () => {
  const e = env();
  await post(e, 'ck', ev);
  await post(e, 'ck', { ...ev, why: 'another reason' });
  await post(e, 'ck', { ...ev, kind: 'error' });
  await post(e, 'ik', ev);
  expect(e.DB.raw.prepare('SELECT COUNT(*) c FROM traces').get().c).toBe(4);
});

test('the same event a minute later starts a new row', async () => {
  const e = env();
  await record(e, 'chat', validate(ev).event, new Date('2026-11-17T10:00:00Z'));
  await record(e, 'chat', validate(ev).event, new Date('2026-11-17T10:02:00Z'));
  expect(e.DB.raw.prepare('SELECT COUNT(*) c FROM traces').get().c).toBe(2);
});

test('an app over its limit gets 429 and the rest of the world is unaffected', () => {
  const t = 1_000_000;
  for (let i = 0; i < 100; i++) expect(overLimit('chat', t)).toBe(false);
  expect(overLimit('chat', t)).toBe(true);
  expect(overLimit('inference', t)).toBe(false);
  expect(overLimit('chat', t + 60_000)).toBe(false);
});

test('rows older than the keep time are deleted', async () => {
  const e = env();
  const now = new Date('2026-11-30T00:00:00Z');
  await record(e, 'chat', validate(ev).event, new Date(now.getTime() - (KEEP_DAYS + 1) * 86400000));
  await record(e, 'chat', validate({ ...ev, why: 'recent' }).event, new Date(now.getTime() - 86400000));
  await cleanup(e, now);
  const rows = e.DB.raw.prepare('SELECT why FROM traces').all();
  expect(rows).toEqual([{ why: 'recent' }]);
});

test('the read API needs the admin key and filters', async () => {
  const e = env();
  await post(e, 'ck', ev);
  await post(e, 'ck', { ...ev, kind: 'error', why: 'Wolf 502' });
  const get = (path, key) => worker.fetch(new Request(`https://t${path}`, { headers: key ? { authorization: `Bearer ${key}` } : {} }), e);
  expect((await get('/api/events')).status).toBe(404);
  expect((await get('/api/events', 'wrong')).status).toBe(404);
  const all = await (await get('/api/events', 'adm')).json();
  expect(all.events.length).toBe(2);
  const errs = await (await get('/api/events?kind=error', 'adm')).json();
  expect(errs.events.map((x) => x.why)).toEqual(['Wolf 502']);
  expect(all.totals.find((t) => t.kind === 'error').events).toBe(1);
});

test('the page loads and never stores the key in the page itself', async () => {
  const r = await worker.fetch(new Request('https://t/'), env());
  expect(r.status).toBe(200);
  const html = await r.text();
  expect(html).toContain('Flisk Traces');
  expect(r.headers.get('content-security-policy')).toContain("default-src 'none'");
  expect(html).not.toContain('adm');
});

// Sign-in through login.flisk.si: a real Ed25519 token, like the login Worker makes.
const b64u = (bytes) => btoa(String.fromCharCode(...new Uint8Array(bytes))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
async function loginToken(login, aud, expSeconds = Math.floor(Date.now() / 1000) + 60) {
  const pair = await crypto.subtle.generateKey('Ed25519', true, ['sign', 'verify']);
  const payload = b64u(new TextEncoder().encode(JSON.stringify({ login, id: 7, aud, iat: 0, exp: expSeconds })));
  const sig = b64u(await crypto.subtle.sign('Ed25519', pair.privateKey, new TextEncoder().encode(payload)));
  return { token: `${payload}.${sig}`, pub: b64u(await crypto.subtle.exportKey('raw', pair.publicKey)) };
}
const authEnv = (pub) => ({ ...env(), LOGIN_PUBLIC_KEY: pub, SESSION_SECRET: 'sess', ADMIN_LOGINS: 'Odykyi, someone' });
async function signIn(e, token) {
  const start = await worker.fetch(new Request('https://t/auth/start'), e);
  expect(start.status).toBe(302);
  expect(start.headers.get('location')).toStartWith('https://login.flisk.si/start?return=');
  const state = /traces_state=([^;]+)/.exec(start.headers.get('set-cookie'))[1];
  return worker.fetch(new Request(`https://t/auth/done?s=${state}&flisk_token=${token}`, { headers: { cookie: `traces_state=${state}` } }), e);
}

test('a listed GitHub login signs in and reads, then the cookie is enough', async () => {
  const { token, pub } = await loginToken('odykyi', 'https://t');
  const e = authEnv(pub);
  await post(e, 'ck', ev);
  const done = await signIn(e, token);
  expect(done.status).toBe(303);
  const cookie = /traces_session=[^;]+/.exec(done.headers.getSetCookie().join('\n'))[0];
  const r = await worker.fetch(new Request('https://t/api/events', { headers: { cookie } }), e);
  expect(r.status).toBe(200);
  expect((await r.json()).events.length).toBe(1);
});

test('another login, an expired or foreign token, and a forged cookie read nothing', async () => {
  const e0 = authEnv((await loginToken('x', 'https://t')).pub);
  const a = await loginToken('stranger', 'https://t');
  expect((await signIn(authEnv(a.pub), a.token)).status).toBe(403);
  const old = await loginToken('odykyi', 'https://t', Math.floor(Date.now() / 1000) - 5);
  expect((await signIn(authEnv(old.pub), old.token)).status).toBe(400);
  const other = await loginToken('odykyi', 'https://chat.flisk.si');
  expect((await signIn(authEnv(other.pub), other.token)).status).toBe(400);
  const forged = 'traces_session=odykyi.9999999999.AAAA';
  expect((await worker.fetch(new Request('https://t/api/events', { headers: { cookie: forged } }), e0)).status).toBe(404);
});

test('sign-in without a matching state cookie is refused', async () => {
  const { token, pub } = await loginToken('odykyi', 'https://t');
  const r = await worker.fetch(new Request(`https://t/auth/done?s=abc&flisk_token=${token}`), authEnv(pub));
  expect(r.status).toBe(400);
});
