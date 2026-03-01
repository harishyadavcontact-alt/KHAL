CREATE TABLE IF NOT EXISTS doctrine_rulebooks (
  id TEXT PRIMARY KEY,
  scope_type TEXT NOT NULL,
  scope_ref TEXT NOT NULL,
  name TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_doctrine_rulebooks_scope_name
  ON doctrine_rulebooks(scope_type, scope_ref, name);
CREATE INDEX IF NOT EXISTS idx_doctrine_rulebooks_scope
  ON doctrine_rulebooks(scope_type, scope_ref, active);

CREATE TABLE IF NOT EXISTS doctrine_rules (
  id TEXT PRIMARY KEY,
  rulebook_id TEXT NOT NULL,
  kind TEXT NOT NULL,
  code TEXT NOT NULL,
  statement TEXT NOT NULL,
  trigger_text TEXT,
  action_text TEXT,
  failure_cost_text TEXT,
  severity TEXT NOT NULL DEFAULT 'SOFT',
  stage TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (rulebook_id) REFERENCES doctrine_rulebooks(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_doctrine_rules_code ON doctrine_rules(code);
CREATE INDEX IF NOT EXISTS idx_doctrine_rules_rulebook ON doctrine_rules(rulebook_id, stage, severity, active, sort_order);

CREATE TABLE IF NOT EXISTS domain_pnl_ladders (
  id TEXT PRIMARY KEY,
  domain_id TEXT NOT NULL,
  level INTEGER NOT NULL DEFAULT 1,
  level_name TEXT NOT NULL,
  threshold_json TEXT NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'LOCKED',
  evidence_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (domain_id) REFERENCES domains(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_domain_pnl_ladders_level ON domain_pnl_ladders(domain_id, level);
CREATE INDEX IF NOT EXISTS idx_domain_pnl_ladders_domain ON domain_pnl_ladders(domain_id, status, level);

INSERT INTO doctrine_rulebooks (id, scope_type, scope_ref, name, active)
VALUES
  ('drb-global-core', 'GLOBAL', 'all', 'Global Core Doctrine', 1),
  ('drb-mode-source', 'MODE', 'source', 'Source Mode Doctrine', 1),
  ('drb-mode-domain', 'MODE', 'domain', 'Domain Mode Doctrine', 1),
  ('drb-mode-affair', 'MODE', 'affair', 'Affair Mode Doctrine', 1),
  ('drb-mode-interest', 'MODE', 'interest', 'Interest Mode Doctrine', 1),
  ('drb-mode-mission', 'MODE', 'mission', 'Mission Mode Doctrine', 1),
  ('drb-mode-lineage', 'MODE', 'lineage', 'Lineage Mode Doctrine', 1)
ON CONFLICT(id) DO UPDATE SET
  scope_type=excluded.scope_type,
  scope_ref=excluded.scope_ref,
  name=excluded.name,
  active=excluded.active,
  updated_at=datetime('now');

INSERT INTO doctrine_rules
  (id, rulebook_id, kind, code, statement, trigger_text, action_text, failure_cost_text, severity, stage, sort_order, active)
VALUES
  (
    'dr-global-no-ruin',
    'drb-global-core',
    'BARRIER',
    'GLOBAL_NO_RUIN',
    'When ruin path exists, do not execute; failure cost: absorbing barrier.',
    'Potential ruin pathway detected',
    'Cap downside before execution',
    'Absorbing barrier',
    'HARD_GATE',
    'E',
    10,
    1
  ),
  (
    'dr-global-tail-metric',
    'drb-global-core',
    'BARRIER',
    'GLOBAL_METRIC_LIMIT',
    'When fat-tail exposure exists, do not rely on variance-only metrics; failure cost: hidden tail transfer.',
    'Tail magnitude uncertainty present',
    'Use tail-aware criteria and thresholds',
    'Model blindness',
    'HARD_GATE',
    'E',
    20,
    1
  ),
  (
    'dr-global-affair-first',
    'drb-global-core',
    'POLICY',
    'GLOBAL_AFFAIR_FIRST',
    'When survivability gap exists, do affair hedge first; failure cost: optionality without survival.',
    'Fragility unresolved',
    'Prioritize obligations',
    'Survivability debt',
    'SOFT',
    'C',
    30,
    1
  ),
  (
    'dr-global-interest-max-loss',
    'drb-global-core',
    'BET_RULE',
    'GLOBAL_INTEREST_MAX_LOSS',
    'When running an interest bet, declare max loss and review date; failure cost: uncapped downside.',
    'Interest mode active',
    'Set max loss and expiry',
    'Unbounded downside',
    'SOFT',
    'D',
    40,
    1
  ),
  (
    'dr-global-skin',
    'drb-global-core',
    'RULE',
    'GLOBAL_SKIN_IN_GAME',
    'When deciding under uncertainty, declare skin in game; failure cost: low accountability.',
    'Decision reaches protocol',
    'Declare capital/time/reputation at risk',
    'Weak discipline',
    'SOFT',
    'B',
    50,
    1
  ),
  (
    'dr-affair-omission',
    'drb-mode-affair',
    'OMISSION',
    'AFFAIR_OMISSION_CADENCE',
    'When affair is active, define omission cadence; failure cost: baseline fragility drift.',
    'Affair mode active',
    'Set daily/weekly/monthly omission cadence',
    'Robustness decay',
    'SOFT',
    'D',
    10,
    1
  ),
  (
    'dr-interest-expiry',
    'drb-mode-interest',
    'BET_RULE',
    'INTEREST_BET_EXPIRY',
    'When interest is active, assign bet expiry/review date; failure cost: stale optionality.',
    'Interest mode active',
    'Set review horizon',
    'Option rot',
    'SOFT',
    'D',
    10,
    1
  )
ON CONFLICT(id) DO UPDATE SET
  rulebook_id=excluded.rulebook_id,
  kind=excluded.kind,
  code=excluded.code,
  statement=excluded.statement,
  trigger_text=excluded.trigger_text,
  action_text=excluded.action_text,
  failure_cost_text=excluded.failure_cost_text,
  severity=excluded.severity,
  stage=excluded.stage,
  sort_order=excluded.sort_order,
  active=excluded.active,
  updated_at=datetime('now');

