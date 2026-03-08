PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS drafts (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  raw_text TEXT NOT NULL,
  inferred_structure_json TEXT NOT NULL DEFAULT '{}',
  selected_anchor_id TEXT,
  ui_state_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS draft_blocks (
  id TEXT PRIMARY KEY,
  draft_id TEXT NOT NULL,
  raw_text TEXT NOT NULL,
  block_kind TEXT NOT NULL,
  start_position INTEGER NOT NULL,
  end_position INTEGER NOT NULL,
  inference_metadata_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (draft_id) REFERENCES drafts(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS structural_anchors (
  id TEXT PRIMARY KEY,
  draft_id TEXT NOT NULL,
  block_id TEXT,
  anchor_type TEXT NOT NULL,
  candidate_entity_type TEXT NOT NULL,
  confidence REAL NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'open',
  title TEXT NOT NULL,
  notes TEXT NOT NULL DEFAULT '',
  value TEXT NOT NULL,
  source_preview TEXT NOT NULL DEFAULT '',
  related_values_json TEXT NOT NULL DEFAULT '[]',
  linked_parent_candidate TEXT,
  source_span_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (draft_id) REFERENCES drafts(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS draft_entity_links (
  id TEXT PRIMARY KEY,
  draft_id TEXT NOT NULL,
  anchor_id TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  link_status TEXT NOT NULL DEFAULT 'suggested',
  source_text TEXT NOT NULL DEFAULT '',
  match_reason TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (draft_id) REFERENCES drafts(id) ON DELETE CASCADE,
  UNIQUE(draft_id, anchor_id, entity_type, entity_id)
);

CREATE TABLE IF NOT EXISTS promotion_events (
  id TEXT PRIMARY KEY,
  draft_id TEXT NOT NULL,
  anchor_id TEXT NOT NULL,
  created_entity_type TEXT NOT NULL,
  created_entity_id TEXT NOT NULL,
  source_text TEXT NOT NULL DEFAULT '',
  timestamp TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (draft_id) REFERENCES drafts(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_draft_blocks_draft ON draft_blocks(draft_id, start_position);
CREATE INDEX IF NOT EXISTS idx_structural_anchors_draft ON structural_anchors(draft_id, block_id, candidate_entity_type);
CREATE INDEX IF NOT EXISTS idx_draft_entity_links_draft ON draft_entity_links(draft_id, anchor_id, link_status);
CREATE INDEX IF NOT EXISTS idx_promotion_events_draft ON promotion_events(draft_id, timestamp DESC);
