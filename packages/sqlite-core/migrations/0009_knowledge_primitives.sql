PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS knowledge_stacks (
  id TEXT PRIMARY KEY,
  craft_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (craft_id) REFERENCES crafts(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS knowledge_protocols (
  id TEXT PRIMARY KEY,
  craft_id TEXT NOT NULL,
  stack_id TEXT,
  name TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (craft_id) REFERENCES crafts(id) ON DELETE CASCADE,
  FOREIGN KEY (stack_id) REFERENCES knowledge_stacks(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS knowledge_rules (
  id TEXT PRIMARY KEY,
  craft_id TEXT NOT NULL,
  protocol_id TEXT,
  statement TEXT NOT NULL,
  rationale TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (craft_id) REFERENCES crafts(id) ON DELETE CASCADE,
  FOREIGN KEY (protocol_id) REFERENCES knowledge_protocols(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS knowledge_heuristics (
  id TEXT PRIMARY KEY,
  craft_id TEXT NOT NULL,
  protocol_id TEXT,
  rule_id TEXT,
  statement TEXT NOT NULL,
  explanation TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (craft_id) REFERENCES crafts(id) ON DELETE CASCADE,
  FOREIGN KEY (protocol_id) REFERENCES knowledge_protocols(id) ON DELETE SET NULL,
  FOREIGN KEY (rule_id) REFERENCES knowledge_rules(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS knowledge_wargames (
  id TEXT PRIMARY KEY,
  craft_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  objective TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (craft_id) REFERENCES crafts(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS knowledge_scenarios (
  id TEXT PRIMARY KEY,
  wargame_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (wargame_id) REFERENCES knowledge_wargames(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS knowledge_threats (
  id TEXT PRIMARY KEY,
  scenario_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  severity INTEGER NOT NULL DEFAULT 5,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (scenario_id) REFERENCES knowledge_scenarios(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS knowledge_responses (
  id TEXT PRIMARY KEY,
  threat_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  response_type TEXT NOT NULL DEFAULT 'MITIGATE',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (threat_id) REFERENCES knowledge_threats(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS knowledge_entity_links (
  id TEXT PRIMARY KEY,
  source_type TEXT NOT NULL,
  source_id TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  link_type TEXT NOT NULL DEFAULT 'REFERENCES',
  notes TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(source_type, source_id, target_type, target_id, link_type)
);

CREATE INDEX IF NOT EXISTS idx_knowledge_stacks_craft ON knowledge_stacks(craft_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_knowledge_protocols_craft ON knowledge_protocols(craft_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_knowledge_rules_craft ON knowledge_rules(craft_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_knowledge_heuristics_craft ON knowledge_heuristics(craft_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_knowledge_scenarios_wargame ON knowledge_scenarios(wargame_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_knowledge_threats_scenario ON knowledge_threats(scenario_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_responses_threat ON knowledge_responses(threat_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_entity_links_source ON knowledge_entity_links(source_type, source_id, sort_order);

INSERT OR IGNORE INTO crafts (id, name, description)
VALUES (
  '0e2f74b9-1e8f-4f3b-9c4f-6371ae6d0ec1',
  'Negotiation',
  'Structured negotiation craft for adversarial and cooperative contexts.'
);

INSERT OR IGNORE INTO knowledge_stacks (id, craft_id, name, description, sort_order)
VALUES (
  '2056bc26-8e5a-4d72-a6f8-d4d15b53f1aa',
  '0e2f74b9-1e8f-4f3b-9c4f-6371ae6d0ec1',
  'Adversarial Bargaining Stack',
  'Core negotiation layers: preparation, opening, leverage, and close.',
  0
);

INSERT OR IGNORE INTO knowledge_protocols (id, craft_id, stack_id, name, description, sort_order)
VALUES (
  '7e95d16f-a68e-4623-b7ff-8709bd530ae8',
  '0e2f74b9-1e8f-4f3b-9c4f-6371ae6d0ec1',
  '2056bc26-8e5a-4d72-a6f8-d4d15b53f1aa',
  'Opening negotiation protocol',
  'Establish agenda, information asymmetry map, and anchor timing before first offer.',
  0
);

INSERT OR IGNORE INTO knowledge_rules (id, craft_id, protocol_id, statement, rationale, sort_order)
VALUES (
  'b5f03e7d-f3a7-4b2b-9a8b-420b2483f241',
  '0e2f74b9-1e8f-4f3b-9c4f-6371ae6d0ec1',
  '7e95d16f-a68e-4623-b7ff-8709bd530ae8',
  'Never reveal reservation price early',
  'Early disclosure destroys optionality and weakens convex payoff potential.',
  0
);

INSERT OR IGNORE INTO knowledge_heuristics (id, craft_id, protocol_id, rule_id, statement, explanation, sort_order)
VALUES (
  '7f8bd84b-1597-4a6c-a31a-abf14f15a56d',
  '0e2f74b9-1e8f-4f3b-9c4f-6371ae6d0ec1',
  '7e95d16f-a68e-4623-b7ff-8709bd530ae8',
  'b5f03e7d-f3a7-4b2b-9a8b-420b2483f241',
  'Silence extracts information',
  'Strategic pauses push counterparties to reveal constraints and hidden priorities.',
  0
);

INSERT OR IGNORE INTO knowledge_wargames (id, craft_id, name, description, objective)
VALUES (
  '0595f785-56f9-470c-a75d-4ba02c4373ea',
  '0e2f74b9-1e8f-4f3b-9c4f-6371ae6d0ec1',
  'Adversarial negotiation simulation',
  'Role-play a hostile counterpart trying to force one-sided terms.',
  'Pressure-test protocol and rule integrity under information warfare.'
);

INSERT OR IGNORE INTO knowledge_scenarios (id, wargame_id, name, description, sort_order)
VALUES (
  'a3e67f79-47e3-4c70-a376-6d2ff5ce8a86',
  '0595f785-56f9-470c-a75d-4ba02c4373ea',
  'Vendor lock-in confrontation',
  'Counterparty uses deadlines and switching costs to force concessions.',
  0
);

INSERT OR IGNORE INTO knowledge_threats (id, scenario_id, name, description, severity)
VALUES (
  '2fe2fd6c-a005-423f-ac9f-6a687bcdf5f8',
  'a3e67f79-47e3-4c70-a376-6d2ff5ce8a86',
  'Artificial deadline pressure',
  'Counterparty manufactures urgency to collapse due diligence.',
  8
);

INSERT OR IGNORE INTO knowledge_responses (id, threat_id, name, description, response_type)
VALUES (
  '7ae3d8ce-6a4c-4313-8432-58d6f6d0bb0b',
  '2fe2fd6c-a005-423f-ac9f-6a687bcdf5f8',
  'Time-boxed counteroffer packet',
  'Respond with pre-committed alternatives and explicit walk-away triggers.',
  'COUNTER'
);

INSERT OR IGNORE INTO knowledge_entity_links (id, source_type, source_id, target_type, target_id, link_type, notes, sort_order)
VALUES
  (
    'e3a4e8be-8fd7-4e08-9f67-5f8f71e76db8',
    'protocol',
    '7e95d16f-a68e-4623-b7ff-8709bd530ae8',
    'rule',
    'b5f03e7d-f3a7-4b2b-9a8b-420b2483f241',
    'GOVERNS',
    'The opening protocol enforces reservation-price secrecy.',
    0
  ),
  (
    'b4f497db-0666-4481-bd7d-c740bcbf023b',
    'rule',
    'b5f03e7d-f3a7-4b2b-9a8b-420b2483f241',
    'heuristic',
    '7f8bd84b-1597-4a6c-a31a-abf14f15a56d',
    'EMBODIED_BY',
    'Silence is the practical expression of the rule.',
    0
  ),
  (
    '3f88de53-d3f9-489c-9370-a10adfba4a89',
    'wargame',
    '0595f785-56f9-470c-a75d-4ba02c4373ea',
    'scenario',
    'a3e67f79-47e3-4c70-a376-6d2ff5ce8a86',
    'CONTAINS',
    'Scenario used inside the negotiation wargame.',
    0
  );
