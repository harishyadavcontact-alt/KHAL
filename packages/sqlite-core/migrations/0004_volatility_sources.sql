CREATE TABLE IF NOT EXISTS volatility_sources (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT UNIQUE NOT NULL,
  sort_order INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS domain_volatility_source_links (
  domain_id TEXT PRIMARY KEY,
  volatility_source_id TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (domain_id) REFERENCES domains(id) ON DELETE CASCADE,
  FOREIGN KEY (volatility_source_id) REFERENCES volatility_sources(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_domain_source_links_source ON domain_volatility_source_links(volatility_source_id);

INSERT INTO volatility_sources (id, code, name, sort_order)
VALUES
  ('src-universe', 'UNIVERSE', 'Universe', 1),
  ('src-nature', 'NATURE', 'Nature', 2),
  ('src-jungle', 'JUNGLE', 'Jungle', 3),
  ('src-land', 'LAND', 'Land', 4),
  ('src-time', 'TIME', 'Time', 5),
  ('src-nurture', 'NURTURE', 'Nurture', 6)
ON CONFLICT(id) DO UPDATE SET
  code = excluded.code,
  name = excluded.name,
  sort_order = excluded.sort_order,
  updated_at = datetime('now');

CREATE TABLE IF NOT EXISTS domain_strategy_details (
  domain_id TEXT PRIMARY KEY,
  stakes_text TEXT,
  risks_text TEXT,
  fragility_text TEXT,
  vulnerabilities_text TEXT,
  hedge_text TEXT,
  edge_text TEXT,
  heuristics_text TEXT,
  tactics_text TEXT,
  interests_text TEXT,
  affairs_text TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (domain_id) REFERENCES domains(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS plan_blueprints (
  id TEXT PRIMARY KEY,
  source_type TEXT NOT NULL,
  source_id TEXT NOT NULL,
  title TEXT NOT NULL,
  schedule_start TEXT,
  schedule_end TEXT,
  cadence TEXT,
  milestones_json TEXT NOT NULL DEFAULT '[]',
  criteria_json TEXT NOT NULL DEFAULT '[]',
  thresholds_json TEXT NOT NULL DEFAULT '[]',
  preparation_json TEXT NOT NULL DEFAULT '{}',
  extras_json TEXT NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'DRAFT',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_plan_blueprints_source ON plan_blueprints(source_type, source_id);
