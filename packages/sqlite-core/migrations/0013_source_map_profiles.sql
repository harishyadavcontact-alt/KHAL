CREATE TABLE IF NOT EXISTS source_map_profiles (
  id TEXT PRIMARY KEY,
  source_id TEXT NOT NULL,
  domain_id TEXT NOT NULL,
  decision_type TEXT NOT NULL CHECK (decision_type IN ('simple', 'complex')),
  tail_class TEXT NOT NULL CHECK (tail_class IN ('thin', 'fat', 'unknown')),
  quadrant TEXT NOT NULL CHECK (quadrant IN ('Q1', 'Q2', 'Q3', 'Q4')),
  method_posture TEXT NOT NULL,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (source_id) REFERENCES volatility_sources(id) ON DELETE CASCADE,
  FOREIGN KEY (domain_id) REFERENCES domains(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_source_map_profiles_source_domain
  ON source_map_profiles(source_id, domain_id);

CREATE INDEX IF NOT EXISTS idx_source_map_profiles_source
  ON source_map_profiles(source_id, quadrant);

CREATE INDEX IF NOT EXISTS idx_source_map_profiles_domain
  ON source_map_profiles(domain_id, quadrant);
