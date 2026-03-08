CREATE TABLE IF NOT EXISTS portfolio_projects (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  tagline TEXT,
  strategic_role TEXT NOT NULL CHECK (strategic_role IN ('core', 'option', 'probe', 'archive', 'killed')),
  stage TEXT NOT NULL CHECK (stage IN ('idea', 'framing', 'build', 'shipping', 'traction', 'stalled', 'archived')),
  mission TEXT,
  wedge TEXT,
  right_tail TEXT,
  left_tail TEXT,
  current_experiment TEXT,
  success_metric TEXT,
  kill_criteria TEXT,
  next_milestone TEXT,
  current_bottleneck TEXT,
  confidence_band TEXT NOT NULL DEFAULT 'watch' CHECK (confidence_band IN ('low', 'watch', 'high')),
  repo_url TEXT,
  repo_name TEXT,
  default_branch TEXT,
  last_shipped_at TEXT,
  last_reviewed_at TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  notes TEXT,
  linked_interest_id TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (linked_interest_id) REFERENCES interests(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_portfolio_projects_role_stage
  ON portfolio_projects(strategic_role, stage, is_active);
CREATE INDEX IF NOT EXISTS idx_portfolio_projects_interest
  ON portfolio_projects(linked_interest_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_projects_updated
  ON portfolio_projects(updated_at DESC);

CREATE TABLE IF NOT EXISTS portfolio_ship_logs (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  title TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('code', 'spec', 'doc', 'design', 'release', 'research', 'prompt')),
  summary TEXT,
  source_label TEXT,
  source_url TEXT,
  shipped_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (project_id) REFERENCES portfolio_projects(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_portfolio_ship_logs_project_time
  ON portfolio_ship_logs(project_id, shipped_at DESC);

CREATE TABLE IF NOT EXISTS portfolio_evidence (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  title TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('user-signal', 'metric', 'observation', 'decision', 'market', 'technical')),
  summary TEXT NOT NULL,
  impact TEXT,
  recorded_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (project_id) REFERENCES portfolio_projects(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_portfolio_evidence_project_time
  ON portfolio_evidence(project_id, recorded_at DESC);

CREATE TABLE IF NOT EXISTS portfolio_decision_gates (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  title TEXT NOT NULL,
  gate_type TEXT NOT NULL CHECK (gate_type IN ('continue', 'scale', 'pause', 'archive', 'kill')),
  criteria TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('open', 'watch', 'cleared', 'triggered')),
  due_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (project_id) REFERENCES portfolio_projects(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_portfolio_decision_gates_project_status
  ON portfolio_decision_gates(project_id, status, due_at);

CREATE TABLE IF NOT EXISTS portfolio_experiments (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  title TEXT NOT NULL,
  hypothesis TEXT NOT NULL,
  expected_learning TEXT,
  status TEXT NOT NULL CHECK (status IN ('planned', 'active', 'paused', 'complete', 'killed')),
  started_at TEXT,
  completed_at TEXT,
  result_summary TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (project_id) REFERENCES portfolio_projects(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_portfolio_experiments_project_status
  ON portfolio_experiments(project_id, status, started_at DESC);

CREATE TABLE IF NOT EXISTS portfolio_repo_adapters (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  adapter_kind TEXT NOT NULL CHECK (adapter_kind IN ('manual', 'meta_json')),
  source_path TEXT,
  metadata_json TEXT,
  last_ingested_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (project_id) REFERENCES portfolio_projects(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_portfolio_repo_adapters_project
  ON portfolio_repo_adapters(project_id);

INSERT INTO portfolio_projects (
  id,
  slug,
  name,
  tagline,
  strategic_role,
  stage,
  mission,
  wedge,
  right_tail,
  left_tail,
  current_experiment,
  success_metric,
  kill_criteria,
  next_milestone,
  current_bottleneck,
  confidence_band,
  repo_name,
  default_branch,
  last_shipped_at,
  last_reviewed_at,
  is_active,
  notes
) VALUES
  (
    'portfolio-khal',
    'khal',
    'KHAL',
    'Decision operating system for uncertainty',
    'core',
    'build',
    'Turn uncertain reality into clear action through war-room quality command surfaces.',
    'Drafts -> Portfolio -> War Gaming -> Execution as one local-first operating loop.',
    'If the command layer compounds across bets, KHAL becomes the system above all projects.',
    'Avoid ontology drift, fake telemetry, and runtime authority fragmentation.',
    'Validate that Portfolio War Room improves cross-project attention allocation within one glance.',
    'Time to clarity under 1 second on portfolio review.',
    'If portfolio views become spreadsheet-like or do not change decisions, cut the feature shape.',
    'Ship the first commander-grade Portfolio War Room route.',
    'Need a clean portfolio command surface without turning Mission Command into project management software.',
    'high',
    'KHAL',
    'main',
    datetime('now', '-2 day'),
    datetime('now', '-1 day'),
    1,
    'Core conviction bet. Portfolio view is the command layer above the rest.'
  ),
  (
    'portfolio-vani',
    'vani',
    'Vani',
    'Language-facing product exploration',
    'option',
    'framing',
    'Probe whether the wedge can produce strong user signal with minimal doctrine overhead.',
    'Use a narrow interface and high-signal narrative framing.',
    'A small right-tail win could create a new acquisition lane.',
    'Do not let it consume core KHAL attention before thesis quality is clear.',
    'Test one focused experiment around user-facing capture and response loops.',
    'One strong external signal of repeat use.',
    'Archive if signal stays anecdotal after two deliberate experiments.',
    'Define the first irreversible user-facing milestone.',
    'Framing is still fuzzy and the wedge is not sharp enough.',
    'watch',
    'Vani',
    'main',
    datetime('now', '-9 day'),
    datetime('now', '-3 day'),
    1,
    'Option lane: deserves attention only if it produces unusually strong evidence.'
  ),
  (
    'portfolio-ashwa',
    'ashwa',
    'Ashwa',
    'High-agency systems experiment',
    'probe',
    'idea',
    'Use Ashwa as a bounded probe for operational heuristics and packaging.',
    'Run small tests that create information rather than commitment.',
    'Could expose new strategy or operating abstractions reusable inside KHAL.',
    'Keep burn low and kill quickly if it remains abstract.',
    'Package one probe with explicit expected learning.',
    'A clear doctrinal insight reusable across KHAL surfaces.',
    'Kill if it cannot produce reusable doctrine or product insight.',
    'Move from idea into a concrete framing packet.',
    'Still too conceptual; needs a sharper hypothesis.',
    'low',
    'Ashwa',
    'main',
    datetime('now', '-20 day'),
    datetime('now', '-7 day'),
    1,
    'Probe lane: information gathering bet, not a commitment sink.'
  ),
  (
    'portfolio-vetala',
    'vetala',
    'Vetala',
    'Preserved archive of prior exploration',
    'archive',
    'archived',
    'Retain the learning without funding fresh attention.',
    'Use as a lessons ledger, not an active frontier.',
    'Historical lessons may still improve future bets.',
    'No current attention budget.',
    NULL,
    'Clear lesson extraction, not growth.',
    'Remain archived unless a truly new wedge appears.',
    'None.',
    'No active bottleneck; inactive by design.',
    'watch',
    'Vetala',
    'main',
    datetime('now', '-120 day'),
    datetime('now', '-60 day'),
    0,
    'Archive lane: anti-delusion memory, not an active bet.'
  )
ON CONFLICT(id) DO NOTHING;

INSERT INTO portfolio_ship_logs (id, project_id, title, type, summary, source_label, source_url, shipped_at) VALUES
  (
    'ship-khal-drafts',
    'portfolio-khal',
    'Drafts runtime persistence shipped',
    'code',
    'SQLite-backed drafts, structural anchors, promotion events, and landing links went live.',
    'Drafts v1',
    NULL,
    datetime('now', '-2 day')
  ),
  (
    'ship-vani-framing',
    'portfolio-vani',
    'Vani wedge framing note',
    'spec',
    'Clarified the product wedge and constraints for the next option review.',
    'Framing note',
    NULL,
    datetime('now', '-9 day')
  )
ON CONFLICT(id) DO NOTHING;

INSERT INTO portfolio_experiments (id, project_id, title, hypothesis, expected_learning, status, started_at, completed_at, result_summary) VALUES
  (
    'experiment-khal-portfolio',
    'portfolio-khal',
    'Portfolio command surface',
    'A visual portfolio command surface will reduce narrative chaos across bets and improve attention allocation.',
    'Whether a one-glance mission-control surface changes what gets attention now.',
    'active',
    datetime('now', '-1 day'),
    NULL,
    NULL
  ),
  (
    'experiment-ashwa-packaging',
    'portfolio-ashwa',
    'Ashwa packaging probe',
    'A narrower packaging frame can make Ashwa legible enough for a real go/no-go decision.',
    'Whether Ashwa contains a real wedge or just abstract appeal.',
    'planned',
    NULL,
    NULL,
    NULL
  )
ON CONFLICT(id) DO NOTHING;

INSERT INTO portfolio_evidence (id, project_id, title, type, summary, impact, recorded_at) VALUES
  (
    'evidence-khal-clarity',
    'portfolio-khal',
    'Cross-surface command gap observed',
    'decision',
    'Multiple active projects created attention fragmentation, motivating a portfolio command surface above individual routes.',
    'Supports building Portfolio War Room as Mission Command infrastructure.',
    datetime('now', '-1 day')
  ),
  (
    'evidence-vetala-archive',
    'portfolio-vetala',
    'Archive retention lesson',
    'observation',
    'Past work still contains reusable lessons even after the bet is no longer funded with attention.',
    'Justifies a cemetery and lessons ledger instead of deleting dead bets.',
    datetime('now', '-50 day')
  )
ON CONFLICT(id) DO NOTHING;

INSERT INTO portfolio_decision_gates (id, project_id, title, gate_type, criteria, status, due_at) VALUES
  (
    'gate-khal-portfolio',
    'portfolio-khal',
    'Continue if command surface changes attention allocation',
    'continue',
    'Keep building only if the surface makes it faster to decide where attention goes this week.',
    'open',
    datetime('now', '+10 day')
  ),
  (
    'gate-vani-scale',
    'portfolio-vani',
    'Scale only on real signal',
    'scale',
    'Do not scale unless a concrete user signal appears beyond anecdotal excitement.',
    'watch',
    datetime('now', '+21 day')
  ),
  (
    'gate-vetala-archive',
    'portfolio-vetala',
    'Archive retained',
    'archive',
    'Keep preserved as lessons only; no active funding.',
    'triggered',
    datetime('now', '-60 day')
  )
ON CONFLICT(id) DO NOTHING;

INSERT INTO portfolio_repo_adapters (id, project_id, adapter_kind, source_path, metadata_json, last_ingested_at) VALUES
  (
    'adapter-khal',
    'portfolio-khal',
    'manual',
    NULL,
    json_object('futureContract', 'project.meta.json'),
    NULL
  ),
  (
    'adapter-vani',
    'portfolio-vani',
    'manual',
    NULL,
    json_object('futureContract', 'project.meta.json'),
    NULL
  )
ON CONFLICT(id) DO NOTHING;
