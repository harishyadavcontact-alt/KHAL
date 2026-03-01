CREATE TABLE IF NOT EXISTS volatility_source_domain_links (
  id TEXT PRIMARY KEY,
  source_id TEXT NOT NULL,
  domain_id TEXT NOT NULL,
  dependency_kind TEXT NOT NULL DEFAULT 'PRIMARY',
  path_weight REAL NOT NULL DEFAULT 1.0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (source_id) REFERENCES volatility_sources(id) ON DELETE CASCADE,
  FOREIGN KEY (domain_id) REFERENCES domains(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_source_domain_links_source ON volatility_source_domain_links(source_id, dependency_kind);
CREATE INDEX IF NOT EXISTS idx_source_domain_links_domain ON volatility_source_domain_links(domain_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_source_domain_primary ON volatility_source_domain_links(domain_id, dependency_kind) WHERE dependency_kind='PRIMARY';

CREATE TABLE IF NOT EXISTS lineage_nodes (
  id TEXT PRIMARY KEY,
  level TEXT NOT NULL,
  name TEXT NOT NULL,
  parent_id TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (parent_id) REFERENCES lineage_nodes(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_lineage_nodes_level_sort ON lineage_nodes(level, sort_order);
CREATE INDEX IF NOT EXISTS idx_lineage_nodes_parent ON lineage_nodes(parent_id);

CREATE TABLE IF NOT EXISTS lineage_entities (
  id TEXT PRIMARY KEY,
  lineage_node_id TEXT NOT NULL,
  actor_type TEXT NOT NULL,
  label TEXT NOT NULL,
  description TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (lineage_node_id) REFERENCES lineage_nodes(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_lineage_entities_node_actor ON lineage_entities(lineage_node_id, actor_type);

CREATE TABLE IF NOT EXISTS lineage_risk_register (
  id TEXT PRIMARY KEY,
  source_id TEXT NOT NULL,
  domain_id TEXT NOT NULL,
  lineage_node_id TEXT NOT NULL,
  title TEXT NOT NULL,
  exposure REAL NOT NULL DEFAULT 5,
  dependency REAL NOT NULL DEFAULT 5,
  irreversibility REAL NOT NULL DEFAULT 5,
  optionality REAL NOT NULL DEFAULT 5,
  response_time REAL NOT NULL DEFAULT 7,
  fragility_score REAL NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'INCOMPLETE',
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (source_id) REFERENCES volatility_sources(id) ON DELETE CASCADE,
  FOREIGN KEY (domain_id) REFERENCES domains(id) ON DELETE CASCADE,
  FOREIGN KEY (lineage_node_id) REFERENCES lineage_nodes(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_lineage_risk_source_domain ON lineage_risk_register(source_id, domain_id);
CREATE INDEX IF NOT EXISTS idx_lineage_risk_lineage_status ON lineage_risk_register(lineage_node_id, status);

CREATE TABLE IF NOT EXISTS plan_blueprint_lineage_targets (
  plan_id TEXT PRIMARY KEY,
  lineage_node_id TEXT,
  actor_type TEXT,
  risk_register_ids_json TEXT NOT NULL DEFAULT '[]',
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (plan_id) REFERENCES plan_blueprints(id) ON DELETE CASCADE,
  FOREIGN KEY (lineage_node_id) REFERENCES lineage_nodes(id) ON DELETE SET NULL
);

INSERT INTO lineage_nodes (id, level, name, parent_id, sort_order)
VALUES
  ('ln-self', 'SELF', 'Self', NULL, 1),
  ('ln-family', 'FAMILY', 'Family', 'ln-self', 2),
  ('ln-state', 'STATE', 'State', 'ln-family', 3),
  ('ln-nation', 'NATION', 'Nation', 'ln-state', 4),
  ('ln-humanity', 'HUMANITY', 'Humanity', 'ln-nation', 5),
  ('ln-nature', 'NATURE', 'Nature', 'ln-humanity', 6)
ON CONFLICT(id) DO UPDATE SET
  level=excluded.level,
  name=excluded.name,
  parent_id=excluded.parent_id,
  sort_order=excluded.sort_order,
  updated_at=datetime('now');

INSERT INTO domains (id, code, name, description)
VALUES
  ('domain-infrastructure-energy', 'domain-infrastructure-energy', 'Infrastructure/Energy', 'Seeded by v0.2.4'),
  ('domain-food-resource', 'domain-food-resource', 'Food/Resource', 'Seeded by v0.2.4'),
  ('domain-economic-power', 'domain-economic-power', 'Economic/Power', 'Seeded by v0.2.4'),
  ('domain-political-legal', 'domain-political-legal', 'Political/Legal', 'Seeded by v0.2.4'),
  ('domain-biological', 'domain-biological', 'Biological', 'Seeded by v0.2.4'),
  ('domain-social-cultural', 'domain-social-cultural', 'Social/Cultural', 'Seeded by v0.2.4')
ON CONFLICT(id) DO NOTHING;

INSERT INTO volatility_source_domain_links (id, source_id, domain_id, dependency_kind, path_weight)
VALUES
  ('sdl-universe-infra', 'src-universe', 'domain-infrastructure-energy', 'PRIMARY', 1.0),
  ('sdl-nature-food', 'src-nature', 'domain-food-resource', 'PRIMARY', 1.0),
  ('sdl-jungle-economic', 'src-jungle', 'domain-economic-power', 'PRIMARY', 1.0),
  ('sdl-land-political', 'src-land', 'domain-political-legal', 'PRIMARY', 1.0),
  ('sdl-time-biological', 'src-time', 'domain-biological', 'PRIMARY', 1.0),
  ('sdl-nurture-social', 'src-nurture', 'domain-social-cultural', 'PRIMARY', 1.0)
ON CONFLICT(id) DO UPDATE SET
  source_id=excluded.source_id,
  domain_id=excluded.domain_id,
  dependency_kind=excluded.dependency_kind,
  path_weight=excluded.path_weight,
  updated_at=datetime('now');

INSERT INTO lineage_risk_register
  (id, source_id, domain_id, lineage_node_id, title, exposure, dependency, irreversibility, optionality, response_time, fragility_score, status, notes)
VALUES
  ('risk-universe-solarflare', 'src-universe', 'domain-infrastructure-energy', 'ln-humanity', 'Solar flare / geomagnetic disruption', 8, 9, 8, 4, 2, 144, 'OPEN', 'Grid dependence under geomagnetic stress'),
  ('risk-nature-waterstress', 'src-nature', 'domain-food-resource', 'ln-family', 'Water stress and crop failure', 7, 8, 7, 4, 14, 117.6, 'OPEN', 'Food and water chain fragility'),
  ('risk-jungle-competition', 'src-jungle', 'domain-economic-power', 'ln-self', 'Competitive displacement', 6, 7, 5, 5, 30, 50.4, 'MITIGATING', 'Market share and capability erosion'),
  ('risk-land-regcapture', 'src-land', 'domain-political-legal', 'ln-state', 'Legal-regulatory capture', 7, 8, 8, 3, 30, 179.2, 'OPEN', 'Adverse legal asymmetry'),
  ('risk-time-aging', 'src-time', 'domain-biological', 'ln-self', 'Aging / health decline', 8, 6, 7, 5, 7, 67.2, 'OPEN', 'Healthspan degradation risk'),
  ('risk-nurture-narrative', 'src-nurture', 'domain-social-cultural', 'ln-nation', 'Narrative capture / memetic drift', 7, 7, 6, 4, 14, 88.2, 'OPEN', 'Collective sensemaking distortion')
ON CONFLICT(id) DO UPDATE SET
  source_id=excluded.source_id,
  domain_id=excluded.domain_id,
  lineage_node_id=excluded.lineage_node_id,
  title=excluded.title,
  exposure=excluded.exposure,
  dependency=excluded.dependency,
  irreversibility=excluded.irreversibility,
  optionality=excluded.optionality,
  response_time=excluded.response_time,
  fragility_score=excluded.fragility_score,
  status=excluded.status,
  notes=excluded.notes,
  updated_at=datetime('now');
