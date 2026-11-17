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

## Deploy

```bash
bunx wrangler@4 d1 create flisk-traces              # put the id in wrangler.toml
bunx wrangler@4 d1 execute flisk-traces --remote --file schema.sql
bunx wrangler@4 secret put TRACE_KEYS               # chat:<key>,inference:<key>   (openssl rand -hex 24 for each key)
bunx wrangler@4 secret put SESSION_SECRET           # openssl rand -hex 32
bunx wrangler@4 secret put ADMIN_KEY                # optional, for scripts
bunx wrangler@4 deploy
```
