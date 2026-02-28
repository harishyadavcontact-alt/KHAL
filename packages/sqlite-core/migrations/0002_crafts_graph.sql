PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS laws (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  volatility_source TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS crafts (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS law_craft_links (
  law_id TEXT NOT NULL,
  craft_id TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (law_id, craft_id),
  FOREIGN KEY (law_id) REFERENCES laws(id) ON DELETE CASCADE,
  FOREIGN KEY (craft_id) REFERENCES crafts(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS craft_heaps (
  id TEXT PRIMARY KEY,
  craft_id TEXT NOT NULL,
  title TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'link',
  url TEXT,
  notes TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (craft_id) REFERENCES crafts(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS craft_models (
  id TEXT PRIMARY KEY,
  craft_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (craft_id) REFERENCES crafts(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS craft_model_heap_links (
  model_id TEXT NOT NULL,
  heap_id TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (model_id, heap_id),
  FOREIGN KEY (model_id) REFERENCES craft_models(id) ON DELETE CASCADE,
  FOREIGN KEY (heap_id) REFERENCES craft_heaps(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS craft_frameworks (
  id TEXT PRIMARY KEY,
  craft_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (craft_id) REFERENCES crafts(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS craft_framework_model_links (
  framework_id TEXT NOT NULL,
  model_id TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (framework_id, model_id),
  FOREIGN KEY (framework_id) REFERENCES craft_frameworks(id) ON DELETE CASCADE,
  FOREIGN KEY (model_id) REFERENCES craft_models(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS craft_barbell_strategies (
  id TEXT PRIMARY KEY,
  craft_id TEXT NOT NULL,
  title TEXT NOT NULL,
  hedge TEXT,
  edge TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (craft_id) REFERENCES crafts(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS craft_barbell_framework_links (
  barbell_id TEXT NOT NULL,
  framework_id TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (barbell_id, framework_id),
  FOREIGN KEY (barbell_id) REFERENCES craft_barbell_strategies(id) ON DELETE CASCADE,
  FOREIGN KEY (framework_id) REFERENCES craft_frameworks(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS craft_heuristics (
  id TEXT PRIMARY KEY,
  craft_id TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (craft_id) REFERENCES crafts(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS craft_heuristic_barbell_links (
  heuristic_id TEXT NOT NULL,
  barbell_id TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (heuristic_id, barbell_id),
  FOREIGN KEY (heuristic_id) REFERENCES craft_heuristics(id) ON DELETE CASCADE,
  FOREIGN KEY (barbell_id) REFERENCES craft_barbell_strategies(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS affair_means (
  affair_id TEXT PRIMARY KEY,
  craft_id TEXT NOT NULL,
  methodology TEXT,
  technology TEXT,
  techniques TEXT,
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (affair_id) REFERENCES affairs(id) ON DELETE CASCADE,
  FOREIGN KEY (craft_id) REFERENCES crafts(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS affair_selected_heuristics (
  affair_id TEXT NOT NULL,
  heuristic_id TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (affair_id, heuristic_id),
  FOREIGN KEY (affair_id) REFERENCES affairs(id) ON DELETE CASCADE,
  FOREIGN KEY (heuristic_id) REFERENCES craft_heuristics(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_law_craft_links_law ON law_craft_links(law_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_law_craft_links_craft ON law_craft_links(craft_id);
CREATE INDEX IF NOT EXISTS idx_craft_heaps_craft ON craft_heaps(craft_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_craft_models_craft ON craft_models(craft_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_craft_frameworks_craft ON craft_frameworks(craft_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_craft_barbells_craft ON craft_barbell_strategies(craft_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_craft_heuristics_craft ON craft_heuristics(craft_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_affair_means_craft ON affair_means(craft_id);
CREATE INDEX IF NOT EXISTS idx_affair_selected_heuristics_heuristic ON affair_selected_heuristics(heuristic_id);
