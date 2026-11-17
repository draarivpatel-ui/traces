# Tasks

## 1. Traces Worker
- [x] 1.1 Worker code, `schema.sql`, `wrangler.toml` (owner still creates the D1 database, secrets and domain, see README)
- [x] 1.2 `POST /v1/trace` with per-key limit, field whitelist (reject anything named prompt, answer or key) and same-event merging
- [x] 1.3 Daily cleanup cron, 14 days
- [x] 1.4 Read-only page behind GitHub login
- [x] 1.5 Tests for ingest, limit, merge, cleanup and the page queries

## 2. Chat first
- [ ] 2.1 Add `trace.js` to flisk-sh/chat; send `error` and `capped` from the ask, build and voice paths
- [ ] 2.2 Send `rerouted` from `modelFrom` when the answering route is not the first planned one
- [ ] 2.3 Send `slow` over the thresholds and `unexpected` from `runProblem`
- [ ] 2.4 Keep `task_runs` until the page covers what it showed, then decide whether to drop it

## 3. Inference
- [ ] 3.1 `error` and `capped` from the inference Worker, `slow` over 20 s

## 4. Rest
- [ ] 4.1 Gardener, docs Ask, fleet, board
- [ ] 4.2 Add traces.flisk.si to the flisk.si bar and flisk-emoji

## 5. Release
- [ ] 5.1 Owner deploys from fresh main; break a route on purpose and see the row appear
