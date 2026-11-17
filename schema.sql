-- Only requests that went wrong or took an unexpected path. A normal request writes nothing.
CREATE TABLE IF NOT EXISTS traces (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  created TEXT NOT NULL,
  app TEXT NOT NULL,            -- chat | inference | gardener | fleet | board
  route TEXT NOT NULL,          -- /api/ask, /v1/chat/completions, ...
  kind TEXT NOT NULL,           -- error | rerouted | slow | unexpected | capped
  why TEXT NOT NULL,            -- one short sentence, no prompt text
  expected TEXT,                -- the route we planned: "wolf"
  actual TEXT,                  -- what really happened: "wolf:429>openrouter:ok"
  model TEXT,
  effort TEXT,
  ms INTEGER,
  status INTEGER,
  detail TEXT,                  -- first 200 characters of the error, no prompt text
  n INTEGER NOT NULL DEFAULT 1, -- how many times the same event repeated inside a minute
  last TEXT NOT NULL            -- time of the latest repeat
);
CREATE INDEX IF NOT EXISTS traces_created ON traces (created);
CREATE INDEX IF NOT EXISTS traces_kind ON traces (app, kind, created);
