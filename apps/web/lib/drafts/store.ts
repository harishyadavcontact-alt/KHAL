import { randomUUID } from "node:crypto";
import type Database from "better-sqlite3";
import { ok, withDb } from "../api";
import {
  buildEntityLink,
  buildPromotion,
  inferDraftStructure,
  type CandidateEntityType,
  type DraftEntityLink,
  type DraftLinkEntityType,
  type PromotionEvent,
  type StructuralAnchor
} from "./parser";

type AnchorState = Record<string, "open" | "accepted" | "dismissed">;

type DraftSaveBody = {
  id?: string;
  title?: string;
  input?: string;
  anchorState?: AnchorState;
  selectedAnchorId?: string | null;
  showDebug?: boolean;
};

type DraftPromoteBody = DraftSaveBody & {
  anchorId?: string;
};

type AnyRow = Record<string, unknown>;

type PersistedDraftBundle = {
  draft: {
    id: string;
    title: string;
    rawText: string;
    inferredStructure: Record<string, unknown>;
    selectedAnchorId?: string;
    uiState: Record<string, unknown>;
    createdAt: string;
    updatedAt: string;
  };
  blocks: Array<{
    id: string;
    draftId: string;
    rawText: string;
    blockKind: string;
    startPosition: number;
    endPosition: number;
    inferenceMetadata: Record<string, unknown>;
  }>;
  anchors: StructuralAnchor[];
  entityLinks: DraftEntityLink[];
  promotionEvents: PromotionEvent[];
};

function parseJson<T>(value: unknown, fallback: T): T {
  if (typeof value !== "string" || !value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function titleFromInput(title: string | undefined, input: string): string {
  if (title?.trim()) return title.trim();
  const firstLine = input.split(/\r?\n/).map((line) => line.trim()).find(Boolean);
  return firstLine ? firstLine.slice(0, 120) : "Untitled draft";
}

function compareText(left: string, right: string) {
  const a = left.trim().toLowerCase();
  const b = right.trim().toLowerCase();
  if (!a || !b) return false;
  return a.includes(b) || b.includes(a);
}

function anchorSignals(anchor: StructuralAnchor): string[] {
  return [anchor.title, anchor.value, anchor.sourcePreview, ...(anchor.relatedValues ?? [])]
    .map((value) => value.trim())
    .filter(Boolean);
}

function mapDraftBundle(db: Database.Database, draftId: string): PersistedDraftBundle | null {
  const draft = db.prepare("SELECT * FROM drafts WHERE id=?").get(draftId) as AnyRow | undefined;
  if (!draft) return null;

  const blocks = db.prepare("SELECT * FROM draft_blocks WHERE draft_id=? ORDER BY start_position, created_at").all(draftId) as AnyRow[];
  const anchors = db.prepare("SELECT * FROM structural_anchors WHERE draft_id=? ORDER BY created_at").all(draftId) as AnyRow[];
  const entityLinks = db.prepare("SELECT * FROM draft_entity_links WHERE draft_id=? ORDER BY link_status, updated_at DESC, created_at DESC").all(draftId) as AnyRow[];
  const promotionEvents = db.prepare("SELECT * FROM promotion_events WHERE draft_id=? ORDER BY timestamp DESC, created_at DESC").all(draftId) as AnyRow[];

  return {
    draft: {
      id: String(draft.id),
      title: String(draft.title),
      rawText: String(draft.raw_text ?? ""),
      inferredStructure: parseJson<Record<string, unknown>>(draft.inferred_structure_json, {}),
      selectedAnchorId: draft.selected_anchor_id ? String(draft.selected_anchor_id) : undefined,
      uiState: parseJson<Record<string, unknown>>(draft.ui_state_json, {}),
      createdAt: String(draft.created_at),
      updatedAt: String(draft.updated_at)
    },
    blocks: blocks.map((row) => ({
      id: String(row.id),
      draftId: String(row.draft_id),
      rawText: String(row.raw_text ?? ""),
      blockKind: String(row.block_kind ?? "paragraph"),
      startPosition: Number(row.start_position ?? 0),
      endPosition: Number(row.end_position ?? 0),
      inferenceMetadata: parseJson<Record<string, unknown>>(row.inference_metadata_json, {})
    })),
    anchors: anchors.map((row) => ({
      id: String(row.id),
      blockId: String(row.block_id ?? ""),
      anchorType: String(row.anchor_type) as StructuralAnchor["anchorType"],
      candidateEntityType: String(row.candidate_entity_type) as CandidateEntityType,
      confidence: Number(row.confidence ?? 0),
      status: String(row.status ?? "open") as StructuralAnchor["status"],
      sourceSpan: parseJson<{ startLine: number; endLine: number }>(row.source_span_json, { startLine: 1, endLine: 1 }),
      title: String(row.title ?? ""),
      notes: String(row.notes ?? ""),
      value: String(row.value ?? ""),
      sourcePreview: String(row.source_preview ?? ""),
      relatedValues: parseJson<string[]>(row.related_values_json, []),
      linkedParentCandidate: row.linked_parent_candidate ? String(row.linked_parent_candidate) : undefined
    })),
    entityLinks: entityLinks.map((row) => ({
      id: String(row.id),
      anchorId: String(row.anchor_id),
      entityType: String(row.entity_type) as DraftLinkEntityType,
      entityId: String(row.entity_id),
      linkStatus: String(row.link_status) as DraftEntityLink["linkStatus"],
      sourceText: String(row.source_text ?? ""),
      matchReason: row.match_reason ? String(row.match_reason) : undefined
    })),
    promotionEvents: promotionEvents.map((row) => ({
      id: String(row.id),
      anchorId: String(row.anchor_id),
      createdEntityType: String(row.created_entity_type) as CandidateEntityType,
      createdEntityId: String(row.created_entity_id),
      sourceText: String(row.source_text ?? ""),
      timestamp: String(row.timestamp)
    }))
  };
}

function upsertDraftEntityLink(db: Database.Database, draftId: string, link: DraftEntityLink) {
  db.prepare(
    `INSERT INTO draft_entity_links (id, draft_id, anchor_id, entity_type, entity_id, link_status, source_text, match_reason, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
     ON CONFLICT(draft_id, anchor_id, entity_type, entity_id)
     DO UPDATE SET link_status=excluded.link_status, source_text=excluded.source_text, match_reason=excluded.match_reason, updated_at=datetime('now')`
  ).run(link.id, draftId, link.anchorId, link.entityType, link.entityId, link.linkStatus, link.sourceText, link.matchReason ?? null);
}

function createSuggestedLinks(db: Database.Database, draftId: string, anchors: StructuralAnchor[]) {
  db.prepare("DELETE FROM draft_entity_links WHERE draft_id=? AND link_status='suggested'").run(draftId);

  const domains = db.prepare("SELECT id, name FROM domains ORDER BY name").all() as AnyRow[];
  const laws = db.prepare("SELECT id, name FROM laws ORDER BY name").all() as AnyRow[];
  const lineageNodes = db.prepare("SELECT id, name, level FROM lineage_nodes ORDER BY sort_order, name").all() as AnyRow[];
  const crafts = db.prepare("SELECT id, name FROM crafts ORDER BY name").all() as AnyRow[];
  const affairs = db.prepare("SELECT id, title FROM affairs ORDER BY title").all() as AnyRow[];
  const interests = db.prepare("SELECT id, title FROM interests ORDER BY title").all() as AnyRow[];

  for (const anchor of anchors) {
    const signals = anchorSignals(anchor);
    const candidateSets: Array<{ rows: AnyRow[]; entityType: DraftLinkEntityType; labelKey: string; matchReason: (label: string) => string }> = [
      { rows: domains, entityType: "domain", labelKey: "name", matchReason: (label) => `Draft language overlaps domain \"${label}\".` },
      { rows: laws, entityType: "law", labelKey: "name", matchReason: (label) => `Draft language overlaps law \"${label}\".` },
      { rows: lineageNodes, entityType: "lineage_node", labelKey: "name", matchReason: (label) => `Draft language overlaps lineage node \"${label}\".` },
      { rows: crafts, entityType: "craft", labelKey: "name", matchReason: (label) => `Existing craft \"${label}\" looks related.` },
      { rows: affairs, entityType: "affair", labelKey: "title", matchReason: (label) => `Existing affair \"${label}\" looks related.` },
      { rows: interests, entityType: "interest", labelKey: "title", matchReason: (label) => `Existing interest \"${label}\" looks related.` }
    ];

    for (const set of candidateSets) {
      for (const row of set.rows) {
        const label = String(row[set.labelKey] ?? "");
        if (!signals.some((signal) => compareText(signal, label))) continue;
        upsertDraftEntityLink(db, draftId, {
          id: `draftlink_${draftId}_${anchor.id}_${set.entityType}_${String(row.id)}`,
          anchorId: anchor.id,
          entityType: set.entityType,
          entityId: String(row.id),
          linkStatus: "suggested",
          sourceText: anchor.value,
          matchReason: set.matchReason(label)
        });
      }
    }
  }
}

function persistDraft(db: Database.Database, body: DraftSaveBody) {
  const input = body.input ?? "";
  const draftId = body.id ?? randomUUID();
  const inference = inferDraftStructure(input);
  const resolvedAnchors = inference.anchors.map((anchor) => ({
    ...anchor,
    status: body.anchorState?.[anchor.id] ?? anchor.status
  }));
  const title = titleFromInput(body.title, input);

  db.prepare(
    `INSERT INTO drafts (id, title, raw_text, inferred_structure_json, selected_anchor_id, ui_state_json, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
     ON CONFLICT(id)
     DO UPDATE SET title=excluded.title, raw_text=excluded.raw_text, inferred_structure_json=excluded.inferred_structure_json,
       selected_anchor_id=excluded.selected_anchor_id, ui_state_json=excluded.ui_state_json, updated_at=datetime('now')`
  ).run(
    draftId,
    title,
    input,
    JSON.stringify(inference.inferred),
    body.selectedAnchorId ?? null,
    JSON.stringify({ anchorState: body.anchorState ?? {}, showDebug: Boolean(body.showDebug) })
  );

  db.prepare("DELETE FROM draft_blocks WHERE draft_id=?").run(draftId);
  db.prepare("DELETE FROM structural_anchors WHERE draft_id=?").run(draftId);

  const insertBlock = db.prepare(
    `INSERT INTO draft_blocks (id, draft_id, raw_text, block_kind, start_position, end_position, inference_metadata_json, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`
  );
  inference.blocks.forEach((block) => {
    const lens = inference.blockLenses.find((item) => item.blockId === block.id);
    insertBlock.run(
      `${draftId}_${block.id}`,
      draftId,
      block.rawText,
      block.blockKind,
      block.startLine,
      block.endLine,
      JSON.stringify({ lens })
    );
  });

  const insertAnchor = db.prepare(
    `INSERT INTO structural_anchors (id, draft_id, block_id, anchor_type, candidate_entity_type, confidence, status, title, notes, value, source_preview, related_values_json, linked_parent_candidate, source_span_json, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`
  );
  resolvedAnchors.forEach((anchor) => {
    insertAnchor.run(
      anchor.id,
      draftId,
      anchor.blockId ? `${draftId}_${anchor.blockId}` : null,
      anchor.anchorType,
      anchor.candidateEntityType,
      anchor.confidence,
      anchor.status,
      anchor.title,
      anchor.notes,
      anchor.value,
      anchor.sourcePreview,
      JSON.stringify(anchor.relatedValues ?? []),
      anchor.linkedParentCandidate ?? null,
      JSON.stringify(anchor.sourceSpan)
    );
  });

  createSuggestedLinks(db, draftId, resolvedAnchors);

  return { draftId, inference };
}

function pickDraftLinkEntity(db: Database.Database, draftId: string, anchorId: string, entityType: DraftLinkEntityType) {
  const row = db
    .prepare(
      `SELECT entity_id
       FROM draft_entity_links
       WHERE draft_id=? AND anchor_id=? AND entity_type=?
       ORDER BY CASE link_status WHEN 'linked' THEN 0 WHEN 'suggested' THEN 1 ELSE 2 END, updated_at DESC
       LIMIT 1`
    )
    .get(draftId, anchorId, entityType) as AnyRow | undefined;
  return row?.entity_id ? String(row.entity_id) : undefined;
}

function pickAnyLinkedEntity(db: Database.Database, draftId: string, entityType: DraftLinkEntityType) {
  const row = db
    .prepare(
      `SELECT entity_id
       FROM draft_entity_links
       WHERE draft_id=? AND entity_type=?
       ORDER BY CASE link_status WHEN 'linked' THEN 0 WHEN 'suggested' THEN 1 ELSE 2 END, updated_at DESC
       LIMIT 1`
    )
    .get(draftId, entityType) as AnyRow | undefined;
  return row?.entity_id ? String(row.entity_id) : undefined;
}

function ensureDomainId(db: Database.Database, draftId: string, anchorId: string) {
  return (
    pickDraftLinkEntity(db, draftId, anchorId, "domain") ??
    pickAnyLinkedEntity(db, draftId, "domain") ??
    ((db.prepare("SELECT id FROM domains ORDER BY name LIMIT 1").get() as AnyRow | undefined)?.id ? String((db.prepare("SELECT id FROM domains ORDER BY name LIMIT 1").get() as AnyRow).id) : undefined)
  );
}

function ensureCraftId(db: Database.Database, draftId: string, anchor: StructuralAnchor, draftTitle: string) {
  const existing = pickDraftLinkEntity(db, draftId, anchor.id, "craft") ?? pickAnyLinkedEntity(db, draftId, "craft");
  if (existing) return existing;
  const craftId = randomUUID();
  db.prepare("INSERT INTO crafts (id, name, description) VALUES (?, ?, ?)").run(craftId, `${draftTitle} craft`, `Auto-created while promoting draft anchor ${anchor.title}`);
  upsertDraftEntityLink(db, draftId, {
    id: `draftlink_${draftId}_${anchor.id}_craft_${craftId}`,
    anchorId: anchor.id,
    entityType: "craft",
    entityId: craftId,
    linkStatus: "linked",
    sourceText: anchor.value,
    matchReason: "Auto-created craft placeholder for draft promotion."
  });
  return craftId;
}

function ensureWargameId(db: Database.Database, draftId: string, anchor: StructuralAnchor, draftTitle: string) {
  const existing = pickDraftLinkEntity(db, draftId, anchor.id, "wargame") ?? pickAnyLinkedEntity(db, draftId, "wargame");
  if (existing) return existing;
  const craftId = ensureCraftId(db, draftId, anchor, draftTitle);
  const wargameId = randomUUID();
  db.prepare("INSERT INTO knowledge_wargames (id, craft_id, name, description, objective) VALUES (?, ?, ?, ?, ?)").run(
    wargameId,
    craftId,
    `${draftTitle} wargame`,
    `Auto-created while promoting draft anchor ${anchor.title}`,
    null
  );
  return wargameId;
}

function ensureScenarioId(db: Database.Database, draftId: string, anchor: StructuralAnchor, draftTitle: string) {
  const existing = pickDraftLinkEntity(db, draftId, anchor.id, "scenario") ?? pickAnyLinkedEntity(db, draftId, "scenario");
  if (existing) return existing;
  const wargameId = ensureWargameId(db, draftId, anchor, draftTitle);
  const scenarioId = randomUUID();
  db.prepare("INSERT INTO knowledge_scenarios (id, wargame_id, name, description, sort_order) VALUES (?, ?, ?, ?, ?)").run(
    scenarioId,
    wargameId,
    `${draftTitle} scenario`,
    `Auto-created while promoting draft anchor ${anchor.title}`,
    0
  );
  return scenarioId;
}

function ensureThreatId(db: Database.Database, draftId: string, anchor: StructuralAnchor, draftTitle: string) {
  const existing = pickDraftLinkEntity(db, draftId, anchor.id, "threat") ?? pickAnyLinkedEntity(db, draftId, "threat");
  if (existing) return existing;
  const scenarioId = ensureScenarioId(db, draftId, anchor, draftTitle);
  const threatId = randomUUID();
  db.prepare("INSERT INTO knowledge_threats (id, scenario_id, name, description, severity) VALUES (?, ?, ?, ?, ?)").run(
    threatId,
    scenarioId,
    `${draftTitle} threat`,
    `Auto-created while promoting draft anchor ${anchor.title}`,
    5
  );
  return threatId;
}

function promoteAnchorEntity(db: Database.Database, draftId: string, anchor: StructuralAnchor, draftTitle: string) {
  if (anchor.candidateEntityType === "affair") {
    const domainId = ensureDomainId(db, draftId, anchor.id);
    if (!domainId) throw new Error("No domain available for affair promotion.");
    const id = randomUUID();
    db.prepare("INSERT INTO affairs (id, domain_id, title, description) VALUES (?, ?, ?, ?)").run(id, domainId, anchor.title, anchor.value);
    return { entityType: "affair" as const, entityId: id };
  }

  if (anchor.candidateEntityType === "interest") {
    const domainId = ensureDomainId(db, draftId, anchor.id);
    if (!domainId) throw new Error("No domain available for interest promotion.");
    const id = randomUUID();
    db.prepare("INSERT INTO interests (id, domain_id, title, notes) VALUES (?, ?, ?, ?)").run(id, domainId, anchor.title, anchor.value);
    return { entityType: "interest" as const, entityId: id };
  }

  if (anchor.candidateEntityType === "craft") {
    const id = randomUUID();
    db.prepare("INSERT INTO crafts (id, name, description) VALUES (?, ?, ?)").run(id, anchor.title, anchor.value);
    return { entityType: "craft" as const, entityId: id };
  }

  if (anchor.candidateEntityType === "stack") {
    const craftId = ensureCraftId(db, draftId, anchor, draftTitle);
    const id = randomUUID();
    db.prepare("INSERT INTO knowledge_stacks (id, craft_id, name, description, sort_order) VALUES (?, ?, ?, ?, ?)").run(id, craftId, anchor.title, anchor.value, 0);
    return { entityType: "stack" as const, entityId: id };
  }

  if (anchor.candidateEntityType === "protocol") {
    const craftId = ensureCraftId(db, draftId, anchor, draftTitle);
    const stackId = pickAnyLinkedEntity(db, draftId, "stack");
    const id = randomUUID();
    db.prepare("INSERT INTO knowledge_protocols (id, craft_id, stack_id, name, description, sort_order) VALUES (?, ?, ?, ?, ?, ?)").run(id, craftId, stackId ?? null, anchor.title, anchor.value, 0);
    return { entityType: "protocol" as const, entityId: id };
  }

  if (anchor.candidateEntityType === "rule") {
    const craftId = ensureCraftId(db, draftId, anchor, draftTitle);
    const protocolId = pickAnyLinkedEntity(db, draftId, "protocol");
    const id = randomUUID();
    db.prepare("INSERT INTO knowledge_rules (id, craft_id, protocol_id, statement, rationale, sort_order) VALUES (?, ?, ?, ?, ?, ?)").run(id, craftId, protocolId ?? null, anchor.title, anchor.value, 0);
    return { entityType: "rule" as const, entityId: id };
  }

  if (anchor.candidateEntityType === "heuristic") {
    const craftId = ensureCraftId(db, draftId, anchor, draftTitle);
    const protocolId = pickAnyLinkedEntity(db, draftId, "protocol");
    const ruleId = pickAnyLinkedEntity(db, draftId, "rule");
    const id = randomUUID();
    db.prepare("INSERT INTO knowledge_heuristics (id, craft_id, protocol_id, rule_id, statement, explanation, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)").run(id, craftId, protocolId ?? null, ruleId ?? null, anchor.title, anchor.value, 0);
    return { entityType: "heuristic" as const, entityId: id };
  }

  if (anchor.candidateEntityType === "wargame") {
    const craftId = ensureCraftId(db, draftId, anchor, draftTitle);
    const id = randomUUID();
    db.prepare("INSERT INTO knowledge_wargames (id, craft_id, name, description, objective) VALUES (?, ?, ?, ?, ?)").run(id, craftId, anchor.title, anchor.value, null);
    return { entityType: "wargame" as const, entityId: id };
  }

  if (anchor.candidateEntityType === "scenario") {
    const wargameId = ensureWargameId(db, draftId, anchor, draftTitle);
    const id = randomUUID();
    db.prepare("INSERT INTO knowledge_scenarios (id, wargame_id, name, description, sort_order) VALUES (?, ?, ?, ?, ?)").run(id, wargameId, anchor.title, anchor.value, 0);
    return { entityType: "scenario" as const, entityId: id };
  }

  if (anchor.candidateEntityType === "threat") {
    const scenarioId = ensureScenarioId(db, draftId, anchor, draftTitle);
    const id = randomUUID();
    db.prepare("INSERT INTO knowledge_threats (id, scenario_id, name, description, severity) VALUES (?, ?, ?, ?, ?)").run(id, scenarioId, anchor.title, anchor.value, 5);
    return { entityType: "threat" as const, entityId: id };
  }

  if (anchor.candidateEntityType === "response") {
    const threatId = ensureThreatId(db, draftId, anchor, draftTitle);
    const id = randomUUID();
    db.prepare("INSERT INTO knowledge_responses (id, threat_id, name, description, response_type) VALUES (?, ?, ?, ?, ?)").run(id, threatId, anchor.title, anchor.value, "MITIGATE");
    return { entityType: "response" as const, entityId: id };
  }

  throw new Error(`Promotion not supported for ${anchor.candidateEntityType}.`);
}

export async function handleDraftLatest() {
  return withDb((db) => {
    const row = db.prepare("SELECT id FROM drafts ORDER BY updated_at DESC, created_at DESC LIMIT 1").get() as AnyRow | undefined;
    if (!row?.id) return ok({ draft: null });
    return ok({ draft: mapDraftBundle(db, String(row.id)) });
  });
}

export async function handleDraftById(id: string) {
  return withDb((db) => {
    const draft = mapDraftBundle(db, id);
    if (!draft) return ok({ error: "Draft not found" }, 404);
    return ok({ draft });
  });
}

export async function handleDraftSave(rawBody: unknown) {
  const body = (rawBody ?? {}) as DraftSaveBody;
  return withDb((db) => {
    const result = persistDraft(db, body);
    return ok({ draft: mapDraftBundle(db, result.draftId) }, body.id ? 200 : 201);
  });
}

export async function handleDraftPromote(rawBody: unknown) {
  const body = (rawBody ?? {}) as DraftPromoteBody;
  if (!body.anchorId) return ok({ error: "anchorId is required" }, 400);

  return withDb((db) => {
    const result = persistDraft(db, body);
    const bundle = mapDraftBundle(db, result.draftId);
    if (!bundle) return ok({ error: "Draft not found after save" }, 404);
    const anchor = bundle.anchors.find((item) => item.id === body.anchorId);
    if (!anchor) return ok({ error: "Anchor not found" }, 404);

    const promoted = promoteAnchorEntity(db, result.draftId, anchor, bundle.draft.title);
    db.prepare("UPDATE structural_anchors SET status='accepted', updated_at=datetime('now') WHERE id=?").run(anchor.id);

    const event = buildPromotion(anchor);
    const promotionEvent: PromotionEvent = {
      ...event,
      createdEntityType: promoted.entityType,
      createdEntityId: promoted.entityId
    };
    db.prepare(
      "INSERT INTO promotion_events (id, draft_id, anchor_id, created_entity_type, created_entity_id, source_text, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?)"
    ).run(promotionEvent.id, result.draftId, anchor.id, promotionEvent.createdEntityType, promotionEvent.createdEntityId, promotionEvent.sourceText, promotionEvent.timestamp);

    const link = buildEntityLink(anchor, true);
    upsertDraftEntityLink(db, result.draftId, {
      ...link,
      entityType: promoted.entityType,
      entityId: promoted.entityId,
      linkStatus: "linked",
      matchReason: "Promoted from structural anchor into a canonical runtime entity."
    });

    return ok({
      promotion: promotionEvent,
      link: {
        ...link,
        entityType: promoted.entityType,
        entityId: promoted.entityId,
        linkStatus: "linked",
        matchReason: "Promoted from structural anchor into a canonical runtime entity."
      },
      draft: mapDraftBundle(db, result.draftId)
    });
  });
}
