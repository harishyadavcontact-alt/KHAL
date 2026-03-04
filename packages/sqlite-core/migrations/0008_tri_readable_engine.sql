CREATE TABLE IF NOT EXISTS decision_overrides (
  id TEXT PRIMARY KEY,
  mode TEXT NOT NULL,
  target_id TEXT NOT NULL,
  guard_ids_json TEXT NOT NULL DEFAULT '[]',
  override_reason TEXT NOT NULL,
  operator TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS decision_evaluations (
  id TEXT PRIMARY KEY,
  mode TEXT NOT NULL,
  target_id TEXT NOT NULL,
  role TEXT NOT NULL,
  blocked INTEGER NOT NULL DEFAULT 0,
  readiness_score REAL NOT NULL DEFAULT 0,
  result_json TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS agent_dry_runs (
  id TEXT PRIMARY KEY,
  mode TEXT NOT NULL,
  target_id TEXT,
  prompt TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  proposed_mutations_json TEXT NOT NULL DEFAULT '[]',
  evaluation_json TEXT NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'PENDING',
  expires_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  committed_at TEXT
);

CREATE TABLE IF NOT EXISTS integration_accounts (
  id TEXT PRIMARY KEY,
  provider TEXT NOT NULL,
  label TEXT NOT NULL,
  config_json TEXT NOT NULL DEFAULT '{}',
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS external_artifacts (
  id TEXT PRIMARY KEY,
  provider TEXT NOT NULL,
  external_id TEXT NOT NULL,
  artifact_type TEXT NOT NULL,
  title TEXT NOT NULL,
  uri TEXT,
  metadata_json TEXT NOT NULL DEFAULT '{}',
  linked_entity_type TEXT,
  linked_entity_id TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_external_artifacts_provider_external
ON external_artifacts(provider, external_id);

CREATE TABLE IF NOT EXISTS sync_operations (
  id TEXT PRIMARY KEY,
  provider TEXT NOT NULL,
  operation_type TEXT NOT NULL,
  dry_run INTEGER NOT NULL DEFAULT 1,
  diff_hash TEXT,
  request_json TEXT NOT NULL DEFAULT '{}',
  response_json TEXT NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'PENDING',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
