CREATE TABLE IF NOT EXISTS time_horizon_profiles (
  user_key TEXT PRIMARY KEY,
  focus_text TEXT,
  dob_iso TEXT,
  life_expectancy_years INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS time_horizon_deadlines (
  id TEXT PRIMARY KEY,
  user_key TEXT NOT NULL,
  label TEXT NOT NULL,
  due_at TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_key) REFERENCES time_horizon_profiles(user_key) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_time_horizon_deadlines_user_due ON time_horizon_deadlines(user_key, due_at);

CREATE TABLE IF NOT EXISTS affair_plan_details (
  affair_id TEXT PRIMARY KEY,
  objectives_json TEXT NOT NULL DEFAULT '[]',
  uncertainty TEXT,
  time_horizon TEXT,
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (affair_id) REFERENCES affairs(id) ON DELETE CASCADE
);
