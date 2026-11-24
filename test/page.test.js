import { expect, test } from 'bun:test';
import { runInNewContext } from 'node:vm';
import { PAGE } from '../src/page.js';

function rowsPage() {
  const table = { style: {} };
  const nodes = new Map();
  const element = (id) => {
    if (!nodes.has(id)) nodes.set(id, { style: {}, value: '', querySelector: () => table });
    return nodes.get(id);
  };
  element('days').value = '7';
  const requests = [];
  const script = PAGE.match(/<script>([\s\S]*?)<\/script>/)[1];
  const initial = runInNewContext(script, {
    document: { getElementById: element },
    URLSearchParams,
    fetch(url) {
      const response = Promise.withResolvers();
      requests.push({ url, respond: response.resolve });
      return response.promise;
    },
  });
  return { element, initial, requests, table };
}

const rows = (kind) => ({
  totals: [],
  events: [{ created: '2026-11-24T14:00:00Z', app: 'chat', kind, why: `${kind} trace`, route: '/ask' }],
});

test('an older response still parsing JSON cannot replace newer filtered rows', async () => {
  const { element, initial, requests } = rowsPage();
  const olderBody = Promise.withResolvers();
  const parsing = Promise.withResolvers();
  requests[0].respond({ ok: true, json: () => { parsing.resolve(); return olderBody.promise; } });
  await parsing.promise;

  element('kind').value = 'slow';
  const filtered = element('kind').onchange();
  expect(requests[1].url).toBe('/api/events?days=7&kind=slow');
  requests[1].respond({ ok: true, json: async () => rows('slow') });
  await filtered;

  olderBody.resolve(rows('error'));
  await initial;
  expect(element('rows').innerHTML).toContain('slow trace');
  expect(element('rows').innerHTML).not.toContain('error trace');
});

test('an older error cannot hide rows from a newer successful refresh', async () => {
  const { element, initial, requests, table } = rowsPage();
  const refreshed = element('go').onclick();
  requests[1].respond({ ok: true, json: async () => rows('slow') });
  await refreshed;

  requests[0].respond({ ok: false });
  await initial;
  expect(table.style.display).toBe('');
  expect(element('msg').textContent).toBe('');
  expect(element('rows').innerHTML).toContain('slow trace');
});
