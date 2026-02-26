PRAGMA journal_mode = WAL;
PRAGMA synchronous = NORMAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS meta_kv (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS domains (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS barbell_strategies (
  id TEXT PRIMARY KEY,
  domain_id TEXT,
  name TEXT NOT NULL,
  defense_notes TEXT,
  offense_notes TEXT,
  hedge_notes TEXT,
  edge_notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (domain_id) REFERENCES domains(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS ends (
  id TEXT PRIMARY KEY,
  domain_id TEXT NOT NULL,
  barbell_strategy_id TEXT,
  title TEXT NOT NULL,
  description TEXT,
  target_date TEXT,
  priority INTEGER NOT NULL DEFAULT 3,
  status TEXT NOT NULL DEFAULT 'NOT_STARTED',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (domain_id) REFERENCES domains(id) ON DELETE CASCADE,
  FOREIGN KEY (barbell_strategy_id) REFERENCES barbell_strategies(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS means (
  id TEXT PRIMARY KEY,
  end_id TEXT NOT NULL,
  title TEXT NOT NULL,
  kind TEXT NOT NULL,
  notes TEXT,
  references_json TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (end_id) REFERENCES ends(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS fragilities (
  id TEXT PRIMARY KEY,
  domain_id TEXT NOT NULL,
  end_id TEXT,
  title TEXT NOT NULL,
  description TEXT,
  volatility_sources TEXT,
  vulnerability_notes TEXT,
  stakes INTEGER NOT NULL DEFAULT 0,
  risk INTEGER NOT NULL DEFAULT 0,
  fragility_score INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (domain_id) REFERENCES domains(id) ON DELETE CASCADE,
  FOREIGN KEY (end_id) REFERENCES ends(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS affairs (
  id TEXT PRIMARY KEY,
  domain_id TEXT NOT NULL,
  fragility_id TEXT,
  end_id TEXT,
  title TEXT NOT NULL,
  description TEXT,
  timeline TEXT,
  stakes INTEGER NOT NULL DEFAULT 0,
  risk INTEGER NOT NULL DEFAULT 0,
  fragility_score INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'NOT_STARTED',
  completion_pct REAL NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (domain_id) REFERENCES domains(id) ON DELETE CASCADE,
  FOREIGN KEY (fragility_id) REFERENCES fragilities(id) ON DELETE SET NULL,
  FOREIGN KEY (end_id) REFERENCES ends(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS interests (
  id TEXT PRIMARY KEY,
  domain_id TEXT NOT NULL,
  end_id TEXT,
  title TEXT NOT NULL,
  description TEXT,
  stakes INTEGER NOT NULL DEFAULT 0,
  risk INTEGER NOT NULL DEFAULT 0,
  asymmetry TEXT,
  upside TEXT,
  downside TEXT,
  convexity INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'NOT_STARTED',
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (domain_id) REFERENCES domains(id) ON DELETE CASCADE,
  FOREIGN KEY (end_id) REFERENCES ends(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS plans (
  id TEXT PRIMARY KEY,
  domain_id TEXT NOT NULL,
  end_id TEXT,
  kind TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  scenario TEXT,
  premortem_notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (domain_id) REFERENCES domains(id) ON DELETE CASCADE,
  FOREIGN KEY (end_id) REFERENCES ends(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS metrics (
  id TEXT PRIMARY KEY,
  plan_id TEXT NOT NULL,
  kind TEXT NOT NULL,
  name TEXT NOT NULL,
  target REAL,
  current REAL,
  unit TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (plan_id) REFERENCES plans(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  source_type TEXT NOT NULL,
  source_id TEXT NOT NULL,
  parent_task_id TEXT,
  title TEXT NOT NULL,
  notes TEXT,
  horizon TEXT NOT NULL DEFAULT 'WEEK',
  due_date TEXT,
  status TEXT NOT NULL DEFAULT 'NOT_STARTED',
  effort_estimate REAL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (parent_task_id) REFERENCES tasks(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS task_dependencies (
  task_id TEXT NOT NULL,
  dependency_task_id TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (task_id, dependency_task_id),
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
  FOREIGN KEY (dependency_task_id) REFERENCES tasks(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS mission_nodes (
  id TEXT PRIMARY KEY,
  ref_type TEXT NOT NULL,
  ref_id TEXT NOT NULL,
  parent_node_id TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (parent_node_id) REFERENCES mission_nodes(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS mission_dependencies (
  mission_node_id TEXT NOT NULL,
  depends_on_node_id TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (mission_node_id, depends_on_node_id),
  FOREIGN KEY (mission_node_id) REFERENCES mission_nodes(id) ON DELETE CASCADE,
  FOREIGN KEY (depends_on_node_id) REFERENCES mission_nodes(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS war_room_sections (
  id TEXT PRIMARY KEY,
  domain_id TEXT,
  section_key TEXT NOT NULL,
  title TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (domain_id) REFERENCES domains(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS war_room_nodes (
  id TEXT PRIMARY KEY,
  section_id TEXT NOT NULL,
  parent_node_id TEXT,
  node_type TEXT NOT NULL,
  key_name TEXT,
  value_text TEXT,
  content_text TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (section_id) REFERENCES war_room_sections(id) ON DELETE CASCADE,
  FOREIGN KEY (parent_node_id) REFERENCES war_room_nodes(id) ON DELETE CASCADE
);

-- One-to-one matrix representation of Genesis.xlsx -> War Room sheet.
CREATE TABLE IF NOT EXISTS war_room_matrix_meta (
  id TEXT PRIMARY KEY,
  sheet_name TEXT NOT NULL DEFAULT 'War Room',
  title TEXT NOT NULL DEFAULT 'WarRoom',
  state_of_the_art_title TEXT,
  state_of_affairs_title TEXT,
  map_navigation_framework TEXT,
  philosopher_stone_text TEXT,
  asymmetry_text TEXT,
  non_linearity_text TEXT,
  science_arts_crafts_text TEXT,
  interests_header TEXT,
  affairs_header TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS war_room_matrix_columns (
  id TEXT PRIMARY KEY,
  sort_order INTEGER NOT NULL,
  excel_column TEXT NOT NULL,
  header_text TEXT NOT NULL,
  semantic_key TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS war_room_matrix_rows (
  id TEXT PRIMARY KEY,
  sort_order INTEGER NOT NULL,
  volatility_law TEXT,
  domain TEXT,
  stakes TEXT,
  risks TEXT,
  fragility_short_volatility TEXT,
  vulnerabilities TEXT,
  ends_barbell_hedge TEXT,
  ends_barbell_edge TEXT,
  means_convex_heuristics TEXT,
  means_mastercraft TEXT,
  state_of_affairs_interests TEXT,
  state_of_affairs_affairs TEXT,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_ends_domain ON ends(domain_id);
CREATE INDEX IF NOT EXISTS idx_means_end ON means(end_id);
CREATE INDEX IF NOT EXISTS idx_fragilities_domain ON fragilities(domain_id);
CREATE INDEX IF NOT EXISTS idx_affairs_domain ON affairs(domain_id);
CREATE INDEX IF NOT EXISTS idx_interests_domain ON interests(domain_id);
CREATE INDEX IF NOT EXISTS idx_plans_domain ON plans(domain_id);
CREATE INDEX IF NOT EXISTS idx_tasks_source ON tasks(source_type, source_id);
CREATE INDEX IF NOT EXISTS idx_tasks_horizon_status ON tasks(horizon, status);
CREATE INDEX IF NOT EXISTS idx_war_room_sections_domain ON war_room_sections(domain_id, section_key);
CREATE INDEX IF NOT EXISTS idx_war_room_nodes_section ON war_room_nodes(section_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_war_room_matrix_rows_sort ON war_room_matrix_rows(sort_order);
