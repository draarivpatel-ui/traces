# Flisk Traces

Analytics for the backend, but only for what went wrong: errors, requests rerouted away from their planned model, slow or unexpected flows, and hit caps. A normal request writes nothing, so it fits the free tier.

Status: planned. See [openspec/changes/build-tracing](openspec/changes/build-tracing/proposal.md).

It stores no prompts, no answers and no keys. Rows are deleted after 14 days.

MIT licence.


## Send a trace

```bash
curl -X POST https://traces.flisk.si/v1/trace -H "authorization: Bearer $TRACE_KEY" \
  -d '{"route":"/api/ask","kind":"rerouted","why":"Wolf 429, OpenRouter answered","expected":"wolf","actual":"wolf:429>openrouter:ok"}'
```

Fields: `route`, `kind` (error, rerouted, slow, unexpected, capped), `why` are required; `expected`, `actual`, `model`, `effort`, `ms`, `status`, `detail` are optional. A field that could hold a prompt, answer, key or login is refused. The same event inside a minute is one row with a count. Each app may send 100 a minute.

Read them at https://traces.flisk.si: press Sign in with GitHub (login.flisk.si). Only the logins in `ADMIN_LOGINS` may read. Scripts can use `GET /api/events?days=7&app=chat&kind=rerouted` with `Authorization: Bearer $ADMIN_KEY`.

The `/api/events` response reports the effective `days` value. The default is 7 for a missing, zero, or nonnumeric value; other numeric values are clamped to 1–14. Omit `app` or `kind` to leave that filter open. An explicit `kind` must be `error`, `rerouted`, `slow`, `unexpected`, or `capped`. Other values return HTTP 400.

## Deploy

```bash
bunx wrangler@4 d1 execute flisk-jobs --remote --file schema.sql   # a free account is at its D1 limit, so the table shares flisk-jobs
bunx wrangler@4 secret put TRACE_KEYS               # chat:<key>,inference:<key>   (openssl rand -hex 24 for each key)
bunx wrangler@4 secret put SESSION_SECRET           # openssl rand -hex 32
bunx wrangler@4 secret put ADMIN_KEY                # optional, for scripts
bunx wrangler@4 deploy
```
