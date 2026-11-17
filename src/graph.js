// Numbers for the Graph tab: every reroute (and every "all models failed") counted by day, reason, answering model and request language.
// Pure: it reads rows already in D1 and sends nothing out. Row weight is n (repeats inside a minute count as repeats).
export const reasonOf = (why = '') => {
  const w = String(why).toLowerCase();
  if (/resting|skipped/.test(w)) return 'wolf resting';
  if (/429|limit|quota|rate/.test(w)) return 'rate limit';
  if (/timeout|timed out|abort/.test(w)) return 'timeout';
  if (/\b5\d\d\b|server error|unavailable|overloaded/.test(w)) return 'server error';
  if (/not found/.test(w)) return 'model not found';
  if (/every free model/.test(w)) return 'every model failed';
  return 'other';
};
export const destOf = (actual = '') => String(actual || 'none').split(' (')[0].trim() || 'none';
export const modelOf = (actual = '', detail = '') => {
  const paren = /\(([^)]+)\)/.exec(actual || '');
  if (paren) return paren[1];
  const by = /answered by (\S+)/.exec(detail || '');
  return by ? by[1] : destOf(actual);
};
export const langOf = (detail = '') => /lang ([a-z]{2})\b/.exec(detail || '')?.[1] || 'unknown';

const bump = (o, k, n) => { o[k] = (o[k] || 0) + n; };
export function buildGraph(rows = [], asks = 0) {
  const g = { total: 0, failed: 0, asks, daily: {}, reasons: {}, models: {}, dests: {}, langs: {}, flow: [] };
  const flow = new Map();
  for (const r of rows) {
    const n = Number(r.n) || 1;
    const dest = r.kind === 'error' ? 'none' : destOf(r.actual);
    const reason = r.kind === 'error' ? 'every model failed' : reasonOf(r.why);
    const lang = r.lang || langOf(r.detail);
    const model = r.kind === 'error' ? 'none' : modelOf(r.actual, r.detail);
    g.total += n;
    if (dest === 'none') g.failed += n;
    const day = String(r.created).slice(0, 10);
    g.daily[day] = g.daily[day] || {};
    bump(g.daily[day], dest, n);
    bump(g.reasons, reason, n);
    bump(g.models, model, n);
    bump(g.dests, dest, n);
    bump(g.langs, lang, n);
    const key = `${lang}|${reason}|${dest}|${model}`;
    flow.set(key, (flow.get(key) || 0) + n);
  }
  g.flow = [...flow].map(([k, n]) => { const [lang, reason, dest, model] = k.split('|'); return { lang, reason, dest, model, n }; }).sort((a, b) => b.n - a.n);
  return g;
}
