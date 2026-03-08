import type Database from "better-sqlite3";

type AnyRow = Record<string, unknown>;

export function queryRows(db: Database.Database, sql: string, ...params: unknown[]) {
  return db.prepare(sql).all(...params) as AnyRow[];
}

export function queryRow(db: Database.Database, sql: string, ...params: unknown[]) {
  return db.prepare(sql).get(...params) as AnyRow | undefined;
}

export function listLaws(db: Database.Database) {
  return queryRows(db, "SELECT id, name FROM laws ORDER BY name");
}

export function listDomains(db: Database.Database) {
  return queryRows(db, "SELECT id, name FROM domains ORDER BY name");
}

export function listAffairs(db: Database.Database) {
  return queryRows(db, "SELECT id, title, domain_id FROM affairs ORDER BY updated_at DESC, created_at DESC");
}

export function listInterests(db: Database.Database) {
  return queryRows(db, "SELECT id, title, domain_id FROM interests ORDER BY updated_at DESC, created_at DESC");
}

export function listPortfolioProjects(db: Database.Database) {
  return queryRows(
    db,
    `SELECT id, slug, name, strategic_role, stage, is_active, linked_interest_id, notes, current_bottleneck
     FROM portfolio_projects
     ORDER BY updated_at DESC, created_at DESC`
  );
}

export function listPortfolioExperiments(db: Database.Database) {
  return queryRows(
    db,
    `SELECT id, project_id, title, status
     FROM portfolio_experiments
     ORDER BY updated_at DESC, created_at DESC`
  );
}

export function listPortfolioDecisionGates(db: Database.Database) {
  return queryRows(
    db,
    `SELECT id, project_id, title, gate_type, status, due_at
     FROM portfolio_decision_gates
     ORDER BY updated_at DESC, created_at DESC`
  );
}

export function listPortfolioEvidence(db: Database.Database) {
  return queryRows(
    db,
    `SELECT id, project_id, title, summary, impact, recorded_at
     FROM portfolio_evidence
     ORDER BY recorded_at DESC, created_at DESC`
  );
}

export function listTasks(db: Database.Database) {
  return queryRows(db, "SELECT id, source_type, source_id, title, status FROM tasks ORDER BY updated_at DESC, created_at DESC");
}

export function listLineageNodes(db: Database.Database) {
  return queryRows(db, "SELECT id, name, parent_id FROM lineage_nodes ORDER BY sort_order, name");
}

export function listLineageEntities(db: Database.Database) {
  return queryRows(db, "SELECT id, lineage_node_id, label FROM lineage_entities ORDER BY created_at");
}

export function listKnowledgeCrafts(db: Database.Database) {
  return queryRows(db, "SELECT id, name FROM crafts ORDER BY name");
}

export function listKnowledgeStacks(db: Database.Database) {
  return queryRows(db, "SELECT id, craft_id, name FROM knowledge_stacks ORDER BY sort_order, created_at");
}

export function listKnowledgeProtocols(db: Database.Database) {
  return queryRows(db, "SELECT id, craft_id, stack_id, name FROM knowledge_protocols ORDER BY sort_order, created_at");
}

export function listKnowledgeRules(db: Database.Database) {
  return queryRows(db, "SELECT id, craft_id, protocol_id, statement FROM knowledge_rules ORDER BY sort_order, created_at");
}

export function listKnowledgeHeuristics(db: Database.Database) {
  return queryRows(db, "SELECT id, craft_id, protocol_id, rule_id, statement FROM knowledge_heuristics ORDER BY sort_order, created_at");
}

export function listKnowledgeWargames(db: Database.Database) {
  return queryRows(db, "SELECT id, craft_id, name FROM knowledge_wargames ORDER BY created_at");
}

export function listKnowledgeScenarios(db: Database.Database) {
  return queryRows(db, "SELECT id, wargame_id, name FROM knowledge_scenarios ORDER BY sort_order, created_at");
}

export function listKnowledgeThreats(db: Database.Database) {
  return queryRows(db, "SELECT id, scenario_id, name FROM knowledge_threats ORDER BY created_at");
}

export function listKnowledgeResponses(db: Database.Database) {
  return queryRows(db, "SELECT id, threat_id, name FROM knowledge_responses ORDER BY created_at");
}

export function listDraftLinkedPromotions(db: Database.Database) {
  return queryRows(
    db,
    `SELECT p.id, p.created_entity_id
     FROM promotion_events p
     LEFT JOIN draft_entity_links l
       ON l.draft_id = p.draft_id
      AND l.anchor_id = p.anchor_id
      AND l.link_status = 'linked'
      AND l.entity_id = p.created_entity_id
     WHERE l.id IS NULL`
  );
}
