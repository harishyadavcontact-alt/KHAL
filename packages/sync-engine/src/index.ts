import { statSync } from "node:fs";
import Database from "better-sqlite3";
import {
  rankDoNow,
  taskCanBeDone,
  type Affair,
  type Craft,
  type DashboardDoNowItem,
  type Interest,
  type KhalState,
  type Law,
  type Task,
  type VolatilitySource,
  type LineageNode,
  type LineageEntity,
  type LineageRisk,
  type DoctrineRulebook,
  type DoctrineRule,
  type DomainPnLLadderLevel
} from "@khal/domain";
import { initDatabase, resolveDbPath } from "@khal/sqlite-core";

export interface SyncStatus {
  dbPath: string;
  modifiedAt: string;
  lastLoadedAt: string;
  stale: boolean;
}

export interface LoadedState {
  state: KhalState;
  dashboard: {
    doNow: DashboardDoNowItem[];
    optionalityIndex: number;
    robustnessProgress: number;
  };
  sync: SyncStatus;
}

type AnyRow = Record<string, unknown>;

function parseJsonOrDefault<T>(value: unknown, fallback: T): T {
  if (typeof value !== "string" || !value.trim()) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function computeRobustnessProgress(affairs: Affair[]): number {
  if (!affairs.length) return 0;
  const weighted = affairs.reduce((acc, affair) => acc + ((affair.fragilityScore ?? 0) * (affair.completionPct ?? 0)), 0);
  const max = affairs.reduce((acc, affair) => acc + (affair.fragilityScore ?? 0) * 100, 0);
  return max === 0 ? 0 : Number(((weighted / max) * 100).toFixed(2));
}

function computeOptionality(interests: Interest[]): number {
  return interests.reduce((acc, interest) => {
    const convexity = Number.isFinite(interest.convexity) ? interest.convexity : 0;
    const stakes = Number.isFinite(interest.stakes) ? interest.stakes : 0;
    return acc + convexity * stakes;
  }, 0);
}

function openDb(inputPath: string): Database.Database {
  const dbPath = resolveDbPath(inputPath);
  initDatabase(dbPath);
  return new Database(dbPath);
}

function ensureDomain(db: Database.Database, domainId: string): void {
  const existing = db.prepare("SELECT id FROM domains WHERE id=?").get(domainId) as { id: string } | undefined;
  if (existing) return;
  db.prepare("INSERT INTO domains (id, code, name, description) VALUES (?, ?, ?, ?)").run(
    domainId,
    domainId,
    domainId.replace(/-/g, " "),
    "Auto-created domain"
  );
}

function loadWarRoomNarrative(db: Database.Database): Record<string, unknown> {
  const meta = db.prepare("SELECT * FROM war_room_matrix_meta LIMIT 1").get() as Record<string, unknown> | undefined;
  const rows = db.prepare("SELECT * FROM war_room_matrix_rows ORDER BY sort_order").all() as Array<Record<string, unknown>>;

  return {
    meta: meta ?? {},
    blocks: rows.map((row) => ({
      heading: row.volatility_law,
      kv: {
        domain: row.domain,
        stakes: row.stakes,
        risks: row.risks,
        fragility: row.fragility_short_volatility,
        vulnerabilities: row.vulnerabilities
      },
      bullets: [
        row.ends_barbell_hedge,
        row.ends_barbell_edge,
        row.means_convex_heuristics,
        row.means_mastercraft,
        row.state_of_affairs_interests,
        row.state_of_affairs_affairs
      ].filter(Boolean)
    }))
  };
}

function mapAffairs(rows: Array<Record<string, unknown>>): Affair[] {
  return rows.map((row) => ({
    id: String(row.id),
    domainId: String(row.domain_id),
    fragilityId: row.fragility_id ? String(row.fragility_id) : undefined,
    endId: row.end_id ? String(row.end_id) : undefined,
    title: String(row.title),
    description: row.description ? String(row.description) : undefined,
    timeline: row.timeline ? String(row.timeline) : undefined,
    stakes: Number(row.stakes ?? 0),
    risk: Number(row.risk ?? 0),
    fragilityScore: Number(row.fragility_score ?? 0),
    status: String(row.status ?? "NOT_STARTED") as Affair["status"],
    completionPct: Number(row.completion_pct ?? 0)
  }));
}

function mapInterests(rows: Array<Record<string, unknown>>): Interest[] {
  return rows.map((row) => ({
    id: String(row.id),
    domainId: String(row.domain_id),
    endId: row.end_id ? String(row.end_id) : undefined,
    title: String(row.title),
    description: row.description ? String(row.description) : undefined,
    stakes: Number(row.stakes ?? 0),
    risk: Number(row.risk ?? 0),
    asymmetry: row.asymmetry ? String(row.asymmetry) : undefined,
    upside: row.upside ? String(row.upside) : undefined,
    downside: row.downside ? String(row.downside) : undefined,
    convexity: Number(row.convexity ?? 0),
    status: String(row.status ?? "NOT_STARTED") as Interest["status"],
    notes: row.notes ? String(row.notes) : undefined
  }));
}

function mapTasks(rows: Array<Record<string, unknown>>, depsByTask: Map<string, string[]>): Task[] {
  return rows.map((row) => ({
    id: String(row.id),
    sourceType: String(row.source_type) as Task["sourceType"],
    sourceId: String(row.source_id),
    parentTaskId: row.parent_task_id ? String(row.parent_task_id) : undefined,
    dependencyIds: depsByTask.get(String(row.id)) ?? [],
    title: String(row.title),
    notes: row.notes ? String(row.notes) : undefined,
    horizon: String(row.horizon ?? "WEEK") as Task["horizon"],
    dueDate: row.due_date ? String(row.due_date) : undefined,
    status: String(row.status ?? "NOT_STARTED") as Task["status"],
    effortEstimate: row.effort_estimate != null ? Number(row.effort_estimate) : undefined
  }));
}

function loadLaws(db: Database.Database): Law[] {
  const rows = db.prepare("SELECT * FROM laws ORDER BY name").all() as AnyRow[];
  const links = db.prepare("SELECT law_id, craft_id FROM law_craft_links ORDER BY sort_order").all() as Array<{ law_id: string; craft_id: string }>;
  const map = new Map<string, string[]>();
  for (const link of links) {
    const current = map.get(link.law_id) ?? [];
    current.push(link.craft_id);
    map.set(link.law_id, current);
  }

  return rows.map((row) => ({
    id: String(row.id),
    name: String(row.name),
    description: row.description ? String(row.description) : undefined,
    volatilitySource: row.volatility_source ? String(row.volatility_source) : undefined,
    associatedCrafts: map.get(String(row.id)) ?? []
  }));
}

function loadVolatilitySourceById(db: Database.Database): Map<string, { id: string; name: string; code: string; sortOrder: number }> {
  const rows = db
    .prepare("SELECT id, code, name, sort_order FROM volatility_sources ORDER BY sort_order, name")
    .all() as Array<{ id: string; code: string; name: string; sort_order: number }>;
  return new Map(rows.map((row) => [row.id, { id: row.id, code: row.code, name: row.name, sortOrder: Number(row.sort_order ?? 0) }]));
}

function loadDomainStrategyDetailsByDomainId(db: Database.Database): Map<string, Record<string, string | undefined>> {
  const rows = db.prepare("SELECT * FROM domain_strategy_details").all() as AnyRow[];
  return new Map(
    rows.map((row) => [
      String(row.domain_id),
      {
        stakesText: row.stakes_text ? String(row.stakes_text) : undefined,
        risksText: row.risks_text ? String(row.risks_text) : undefined,
        fragilityText: row.fragility_text ? String(row.fragility_text) : undefined,
        vulnerabilitiesText: row.vulnerabilities_text ? String(row.vulnerabilities_text) : undefined,
        hedge: row.hedge_text ? String(row.hedge_text) : undefined,
        edge: row.edge_text ? String(row.edge_text) : undefined,
        heuristics: row.heuristics_text ? String(row.heuristics_text) : undefined,
        tactics: row.tactics_text ? String(row.tactics_text) : undefined,
        interestsText: row.interests_text ? String(row.interests_text) : undefined,
        affairsText: row.affairs_text ? String(row.affairs_text) : undefined
      }
    ])
  );
}

function loadDomainSourceLinkByDomainId(db: Database.Database): Map<string, string> {
  const rows = db.prepare("SELECT domain_id, volatility_source_id FROM domain_volatility_source_links").all() as Array<{ domain_id: string; volatility_source_id: string }>;
  return new Map(rows.map((row) => [row.domain_id, row.volatility_source_id]));
}

function loadPrimarySourceByDomainId(db: Database.Database): Map<string, string> {
  const rows = db
    .prepare("SELECT domain_id, source_id FROM volatility_source_domain_links WHERE dependency_kind='PRIMARY'")
    .all() as Array<{ domain_id: string; source_id: string }>;
  return new Map(rows.map((row) => [row.domain_id, row.source_id]));
}

function loadSources(db: Database.Database): VolatilitySource[] {
  const sources = db.prepare("SELECT id, code, name, sort_order FROM volatility_sources ORDER BY sort_order, name").all() as Array<{ id: string; code: string; name: string; sort_order: number }>;
  const links = db
    .prepare("SELECT id, source_id, domain_id, dependency_kind, path_weight FROM volatility_source_domain_links ORDER BY dependency_kind, path_weight DESC")
    .all() as Array<{ id: string; source_id: string; domain_id: string; dependency_kind: string; path_weight: number }>;

  return sources.map((source) => ({
    id: source.id,
    code: source.code,
    name: source.name,
    sortOrder: Number(source.sort_order ?? 0),
    domains: links
      .filter((link) => link.source_id === source.id)
      .map((link) => ({
        id: link.id,
        sourceId: link.source_id,
        domainId: link.domain_id,
        dependencyKind: link.dependency_kind,
        pathWeight: Number(link.path_weight ?? 1)
      }))
  }));
}

function loadLineages(db: Database.Database): { nodes: LineageNode[]; entities: LineageEntity[] } {
  const nodes = db
    .prepare("SELECT id, level, name, parent_id, sort_order FROM lineage_nodes ORDER BY sort_order, name")
    .all() as Array<{ id: string; level: string; name: string; parent_id?: string; sort_order: number }>;
  const entities = db
    .prepare("SELECT id, lineage_node_id, actor_type, label, description FROM lineage_entities ORDER BY created_at")
    .all() as Array<{ id: string; lineage_node_id: string; actor_type: string; label: string; description?: string }>;
  return {
    nodes: nodes.map((row) => ({
      id: row.id,
      level: row.level,
      name: row.name,
      parentId: row.parent_id ?? undefined,
      sortOrder: Number(row.sort_order ?? 0)
    })),
    entities: entities.map((row) => ({
      id: row.id,
      lineageNodeId: row.lineage_node_id,
      actorType: row.actor_type,
      label: row.label,
      description: row.description ?? undefined
    }))
  };
}

function loadLineageRisks(db: Database.Database): LineageRisk[] {
  const rows = db
    .prepare(
      `SELECT id, source_id, domain_id, lineage_node_id, title, exposure, dependency, irreversibility, optionality, response_time, fragility_score, status, notes
       FROM lineage_risk_register
       ORDER BY updated_at DESC, created_at DESC`
    )
    .all() as Array<{
      id: string;
      source_id: string;
      domain_id: string;
      lineage_node_id: string;
      title: string;
      exposure: number;
      dependency: number;
      irreversibility: number;
      optionality: number;
      response_time: number;
      fragility_score: number;
      status: string;
      notes?: string;
    }>;
  return rows.map((row) => ({
    id: row.id,
    sourceId: row.source_id,
    domainId: row.domain_id,
    lineageNodeId: row.lineage_node_id,
    title: row.title,
    exposure: Number(row.exposure ?? 5),
    dependency: Number(row.dependency ?? 5),
    irreversibility: Number(row.irreversibility ?? 5),
    optionality: Number(row.optionality ?? 5),
    responseTime: Number(row.response_time ?? 7),
    fragilityScore: Number(row.fragility_score ?? 0),
    status: row.status ?? "INCOMPLETE",
    notes: row.notes ?? undefined
  }));
}

function loadDoctrineRulebooks(db: Database.Database): DoctrineRulebook[] {
  const rows = db
    .prepare("SELECT id, scope_type, scope_ref, name, active FROM doctrine_rulebooks ORDER BY scope_type, scope_ref, name")
    .all() as Array<{ id: string; scope_type: string; scope_ref: string; name: string; active: number }>;
  return rows.map((row) => ({
    id: row.id,
    scopeType: row.scope_type as DoctrineRulebook["scopeType"],
    scopeRef: row.scope_ref,
    name: row.name,
    active: Number(row.active ?? 1) === 1
  }));
}

function loadDoctrineRules(db: Database.Database): DoctrineRule[] {
  const rows = db
    .prepare(
      `SELECT id, rulebook_id, kind, code, statement, trigger_text, action_text, failure_cost_text, severity, stage, sort_order, active
       FROM doctrine_rules
       ORDER BY sort_order, created_at`
    )
    .all() as Array<{
      id: string;
      rulebook_id: string;
      kind: string;
      code: string;
      statement: string;
      trigger_text?: string;
      action_text?: string;
      failure_cost_text?: string;
      severity: string;
      stage?: string;
      sort_order: number;
      active: number;
    }>;
  return rows.map((row) => ({
    id: row.id,
    rulebookId: row.rulebook_id,
    kind: row.kind as DoctrineRule["kind"],
    code: row.code,
    statement: row.statement,
    triggerText: row.trigger_text ?? undefined,
    actionText: row.action_text ?? undefined,
    failureCostText: row.failure_cost_text ?? undefined,
    severity: row.severity as DoctrineRule["severity"],
    stage: row.stage as DoctrineRule["stage"],
    sortOrder: Number(row.sort_order ?? 0),
    active: Number(row.active ?? 1) === 1
  }));
}

function loadDomainPnLLadders(db: Database.Database): DomainPnLLadderLevel[] {
  const rows = db
    .prepare(
      `SELECT id, domain_id, level, level_name, threshold_json, status, evidence_json
       FROM domain_pnl_ladders
       ORDER BY domain_id, level`
    )
    .all() as Array<{
      id: string;
      domain_id: string;
      level: number;
      level_name: string;
      threshold_json: string;
      status: string;
      evidence_json: string;
    }>;
  return rows.map((row) => ({
    id: row.id,
    domainId: row.domain_id,
    level: Number(row.level ?? 1),
    levelName: row.level_name,
    threshold: parseJsonOrDefault<Record<string, unknown>>(row.threshold_json, {}),
    status: row.status,
    evidence: parseJsonOrDefault<Record<string, unknown>>(row.evidence_json, {})
  }));
}

function loadMissionGraph(db: Database.Database): {
  nodes: Array<{
    id: string;
    missionId: string;
    refType: "MISSION" | "SOURCE" | "DOMAIN" | "END" | "AFFAIR" | "INTEREST" | "LINEAGE" | "TASK";
    refId: string;
    parentNodeId?: string;
    sortOrder: number;
  }>;
  dependencies: Array<{ missionNodeId: string; dependsOnNodeId: string }>;
} {
  const nodeRows = db
    .prepare("SELECT id, ref_type, ref_id, parent_node_id, sort_order FROM mission_nodes ORDER BY sort_order, created_at")
    .all() as Array<{ id: string; ref_type: string; ref_id: string; parent_node_id?: string; sort_order: number }>;
  const dependencyRows = db
    .prepare("SELECT mission_node_id, depends_on_node_id FROM mission_dependencies ORDER BY created_at")
    .all() as Array<{ mission_node_id: string; depends_on_node_id: string }>;

  const byId = new Map(nodeRows.map((row) => [row.id, row]));
  const missionMemo = new Map<string, string>();
  const resolveMissionId = (nodeId: string): string => {
    const cached = missionMemo.get(nodeId);
    if (cached) return cached;
    const node = byId.get(nodeId);
    if (!node) return "mission-global";
    if (node.ref_type === "MISSION") {
      missionMemo.set(nodeId, node.ref_id);
      return node.ref_id;
    }
    if (!node.parent_node_id) {
      missionMemo.set(nodeId, "mission-global");
      return "mission-global";
    }
    const missionId = resolveMissionId(node.parent_node_id);
    missionMemo.set(nodeId, missionId);
    return missionId;
  };

  return {
    nodes: nodeRows.map((row) => ({
      id: row.id,
      missionId: resolveMissionId(row.id),
      refType: row.ref_type as "MISSION" | "SOURCE" | "DOMAIN" | "END" | "AFFAIR" | "INTEREST" | "LINEAGE" | "TASK",
      refId: row.ref_id,
      parentNodeId: row.parent_node_id ?? undefined,
      sortOrder: Number(row.sort_order ?? 0)
    })),
    dependencies: dependencyRows.map((row) => ({
      missionNodeId: row.mission_node_id,
      dependsOnNodeId: row.depends_on_node_id
    }))
  };
}

function loadCrafts(db: Database.Database): Craft[] {
  const crafts = db.prepare("SELECT * FROM crafts ORDER BY name").all() as AnyRow[];
  const heaps = db.prepare("SELECT * FROM craft_heaps ORDER BY sort_order, created_at").all() as AnyRow[];
  const models = db.prepare("SELECT * FROM craft_models ORDER BY sort_order, created_at").all() as AnyRow[];
  const frameworks = db.prepare("SELECT * FROM craft_frameworks ORDER BY sort_order, created_at").all() as AnyRow[];
  const barbells = db.prepare("SELECT * FROM craft_barbell_strategies ORDER BY sort_order, created_at").all() as AnyRow[];
  const heuristics = db.prepare("SELECT * FROM craft_heuristics ORDER BY sort_order, created_at").all() as AnyRow[];
  const modelHeapLinks = db.prepare("SELECT model_id, heap_id FROM craft_model_heap_links ORDER BY sort_order").all() as Array<{ model_id: string; heap_id: string }>;
  const frameworkModelLinks = db
    .prepare("SELECT framework_id, model_id FROM craft_framework_model_links ORDER BY sort_order")
    .all() as Array<{ framework_id: string; model_id: string }>;
  const barbellFrameworkLinks = db
    .prepare("SELECT barbell_id, framework_id FROM craft_barbell_framework_links ORDER BY sort_order")
    .all() as Array<{ barbell_id: string; framework_id: string }>;
  const heuristicBarbellLinks = db
    .prepare("SELECT heuristic_id, barbell_id FROM craft_heuristic_barbell_links ORDER BY sort_order")
    .all() as Array<{ heuristic_id: string; barbell_id: string }>;

  const links = (records: Array<{ from: string; to: string }>) => {
    const out = new Map<string, string[]>();
    for (const record of records) {
      const current = out.get(record.from) ?? [];
      current.push(record.to);
      out.set(record.from, current);
    }
    return out;
  };
  const heapByModel = links(modelHeapLinks.map((row) => ({ from: row.model_id, to: row.heap_id })));
  const modelByFramework = links(frameworkModelLinks.map((row) => ({ from: row.framework_id, to: row.model_id })));
  const frameworkByBarbell = links(barbellFrameworkLinks.map((row) => ({ from: row.barbell_id, to: row.framework_id })));
  const barbellByHeuristic = links(heuristicBarbellLinks.map((row) => ({ from: row.heuristic_id, to: row.barbell_id })));

  return crafts.map((craft) => {
    const craftId = String(craft.id);
    return {
      id: craftId,
      name: String(craft.name),
      description: craft.description ? String(craft.description) : undefined,
      heaps: heaps
        .filter((item) => String(item.craft_id) === craftId)
        .map((item) => ({
          id: String(item.id),
          title: String(item.title),
          type: (String(item.type || "link") as "link" | "file"),
          url: item.url ? String(item.url) : undefined,
          notes: item.notes ? String(item.notes) : undefined
        })),
      models: models
        .filter((item) => String(item.craft_id) === craftId)
        .map((item) => ({
          id: String(item.id),
          title: String(item.title),
          description: item.description ? String(item.description) : undefined,
          heapIds: heapByModel.get(String(item.id)) ?? []
        })),
      frameworks: frameworks
        .filter((item) => String(item.craft_id) === craftId)
        .map((item) => ({
          id: String(item.id),
          title: String(item.title),
          description: item.description ? String(item.description) : undefined,
          modelIds: modelByFramework.get(String(item.id)) ?? []
        })),
      barbellStrategies: barbells
        .filter((item) => String(item.craft_id) === craftId)
        .map((item) => ({
          id: String(item.id),
          title: String(item.title),
          hedge: item.hedge ? String(item.hedge) : undefined,
          edge: item.edge ? String(item.edge) : undefined,
          frameworkIds: frameworkByBarbell.get(String(item.id)) ?? []
        })),
      heuristics: heuristics
        .filter((item) => String(item.craft_id) === craftId)
        .map((item) => ({
          id: String(item.id),
          title: String(item.title),
          content: item.content ? String(item.content) : undefined,
          barbellStrategyIds: barbellByHeuristic.get(String(item.id)) ?? []
        }))
    };
  });
}

function loadAffairMeans(db: Database.Database): Map<string, { craftId: string; selectedHeuristicIds: string[]; methodology?: string; technology?: string; techniques?: string }> {
  const rows = db.prepare("SELECT * FROM affair_means").all() as AnyRow[];
  const selected = db.prepare("SELECT affair_id, heuristic_id FROM affair_selected_heuristics").all() as Array<{ affair_id: string; heuristic_id: string }>;
  const selectedMap = new Map<string, string[]>();
  for (const row of selected) {
    const current = selectedMap.get(row.affair_id) ?? [];
    current.push(row.heuristic_id);
    selectedMap.set(row.affair_id, current);
  }
  const result = new Map<string, { craftId: string; selectedHeuristicIds: string[]; methodology?: string; technology?: string; techniques?: string }>();
  for (const row of rows) {
    const affairId = String(row.affair_id);
    result.set(affairId, {
      craftId: String(row.craft_id),
      selectedHeuristicIds: selectedMap.get(affairId) ?? [],
      methodology: row.methodology ? String(row.methodology) : undefined,
      technology: row.technology ? String(row.technology) : undefined,
      techniques: row.techniques ? String(row.techniques) : undefined
    });
  }
  return result;
}

function loadAffairPlanDetails(
  db: Database.Database
): Map<string, { objectives: string[]; uncertainty?: string; timeHorizon?: string }> {
  const rows = db.prepare("SELECT * FROM affair_plan_details").all() as AnyRow[];
  const result = new Map<string, { objectives: string[]; uncertainty?: string; timeHorizon?: string }>();
  for (const row of rows) {
    const affairId = String(row.affair_id);
    let objectives: string[] = [];
    try {
      const parsed = JSON.parse(String(row.objectives_json ?? "[]"));
      if (Array.isArray(parsed)) objectives = parsed.map((item) => String(item));
    } catch {
      objectives = [];
    }
    result.set(affairId, {
      objectives,
      uncertainty: row.uncertainty ? String(row.uncertainty) : undefined,
      timeHorizon: row.time_horizon ? String(row.time_horizon) : undefined
    });
  }
  return result;
}

export function loadState(dbPathInput: string): LoadedState {
  const dbPath = resolveDbPath(dbPathInput);
  const db = openDb(dbPath);

  try {
    const domainRows = db.prepare("SELECT * FROM domains ORDER BY name").all() as Array<Record<string, unknown>>;
    const affairsRows = db.prepare("SELECT * FROM affairs ORDER BY created_at DESC").all() as Array<Record<string, unknown>>;
    const interestsRows = db.prepare("SELECT * FROM interests ORDER BY created_at DESC").all() as Array<Record<string, unknown>>;
    const taskRows = db.prepare("SELECT * FROM tasks ORDER BY created_at DESC").all() as Array<Record<string, unknown>>;
    const taskDepsRows = db.prepare("SELECT task_id, dependency_task_id FROM task_dependencies").all() as Array<{ task_id: string; dependency_task_id: string }>;

    const depsByTask = new Map<string, string[]>();
    for (const dep of taskDepsRows) {
      const list = depsByTask.get(dep.task_id) ?? [];
      list.push(dep.dependency_task_id);
      depsByTask.set(dep.task_id, list);
    }

    const volatilitySourceById = loadVolatilitySourceById(db);
    const strategyDetailsByDomainId = loadDomainStrategyDetailsByDomainId(db);
    const domainSourceByDomainId = loadDomainSourceLinkByDomainId(db);
    const domainPrimarySourceByDomainId = loadPrimarySourceByDomainId(db);
    const narrativeByDomainName = new Map(
      ((loadWarRoomNarrative(db).blocks as Array<Record<string, unknown>>) ?? []).map((block) => [String((block.kv as AnyRow)?.domain ?? ""), block])
    );
    const domains = domainRows.map((row) => {
      const domainId = String(row.id);
      const domainName = String(row.name);
      const volatilitySourceId = domainPrimarySourceByDomainId.get(domainId) ?? domainSourceByDomainId.get(domainId);
      const source = volatilitySourceId ? volatilitySourceById.get(volatilitySourceId) : undefined;
      const strategyDetails = strategyDetailsByDomainId.get(domainId) ?? {};
      const narrative = narrativeByDomainName.get(domainName);
      const kv = (narrative?.kv as AnyRow | undefined) ?? {};
      const bullets = (narrative?.bullets as string[] | undefined) ?? [];

      return {
        id: domainId,
        name: domainName,
        description: row.description ? String(row.description) : undefined,
        createdAt: String(row.created_at),
        updatedAt: String(row.updated_at),
        volatilitySourceId,
        volatilitySourceName: source?.name,
        lawId: volatilitySourceId,
        stakesText: strategyDetails.stakesText ?? (kv.stakes ? String(kv.stakes) : undefined),
        risksText: strategyDetails.risksText ?? (kv.risks ? String(kv.risks) : undefined),
        fragilityText: strategyDetails.fragilityText ?? (kv.fragility ? String(kv.fragility) : undefined),
        vulnerabilitiesText: strategyDetails.vulnerabilitiesText ?? (kv.vulnerabilities ? String(kv.vulnerabilities) : undefined),
        hedge: strategyDetails.hedge ?? bullets[0],
        edge: strategyDetails.edge ?? bullets[1],
        heuristics: strategyDetails.heuristics ?? bullets[2],
        tactics: strategyDetails.tactics ?? bullets[3],
        interestsText: strategyDetails.interestsText ?? bullets[4],
        affairsText: strategyDetails.affairsText ?? bullets[5]
      };
    });
    const laws = loadLaws(db);
    const sources = loadSources(db);
    const lineages = loadLineages(db);
    const lineageRisks = loadLineageRisks(db);
    const doctrine = {
      rulebooks: loadDoctrineRulebooks(db),
      rules: loadDoctrineRules(db),
      domainPnLLadders: loadDomainPnLLadders(db)
    };
    const missionGraph = loadMissionGraph(db);
    const crafts = loadCrafts(db);
    const affairMeans = loadAffairMeans(db);
    const affairPlanDetails = loadAffairPlanDetails(db);
    const affairs = mapAffairs(affairsRows).map((affair) => {
      const fragilityState = ((affair.fragilityScore ?? 0) > 50 ? "fragile" : "robust") as "fragile" | "robust";
      const plan = affairPlanDetails.get(affair.id) ?? {
        objectives: [],
        uncertainty: "Unknown",
        timeHorizon: "Unknown"
      };
      return {
        ...affair,
        context: {
          associatedDomains: [affair.domainId],
          volatilityExposure: affair.description ?? "Operational volatility"
        },
        means: affairMeans.get(affair.id) ?? (crafts[0] ? { craftId: crafts[0].id, selectedHeuristicIds: [] } : undefined),
        plan,
        strategy: {
          posture: "defense",
          positioning: "conventional",
          mapping: { allies: [], enemies: [] }
        },
        entities: [
          {
            id: `entity-${affair.id}`,
            name: affair.title,
            type: "affair",
            fragility: fragilityState
          }
        ]
      };
    });
    const interests = mapInterests(interestsRows);
    const tasks = mapTasks(taskRows, depsByTask);
    const missionDepsByNode = new Map<string, string[]>();
    for (const dependency of missionGraph.dependencies) {
      const current = missionDepsByNode.get(dependency.missionNodeId) ?? [];
      current.push(dependency.dependsOnNodeId);
      missionDepsByNode.set(dependency.missionNodeId, current);
    }
    const missionNodes = missionGraph.nodes
      .filter((node) => node.refType !== "MISSION")
      .map((node) => ({
        id: node.id,
        refType: node.refType,
        refId: node.refId,
        parentNodeId: node.parentNodeId,
        sortOrder: node.sortOrder,
        dependencyIds: missionDepsByNode.get(node.id) ?? []
      }));

    const doNow = rankDoNow(affairs, interests, tasks);
    const stats = statSync(dbPath);

    return {
      state: {
        domains,
        laws,
        crafts,
        ends: [],
        fragilities: [],
        affairs,
        interests,
        tasks,
        missionNodes,
        missionGraph,
        warRoomNarrative: loadWarRoomNarrative(db),
        sources,
        lineages,
        lineageRisks,
        doctrine
      },
      dashboard: {
        doNow,
        optionalityIndex: computeOptionality(interests),
        robustnessProgress: computeRobustnessProgress(affairs)
      },
      sync: {
        dbPath,
        modifiedAt: stats.mtime.toISOString(),
        lastLoadedAt: new Date().toISOString(),
        stale: false
      }
    };
  } finally {
    db.close();
  }
}

export function detectConflict(dbPathInput: string, lastSeenModifiedAt: string): boolean {
  const dbPath = resolveDbPath(dbPathInput);
  if (!statSync(dbPath, { throwIfNoEntry: false })) return false;
  const modifiedAt = statSync(dbPath).mtime.toISOString();
  return Boolean(lastSeenModifiedAt) && modifiedAt > lastSeenModifiedAt;
}

export function refreshIfStale(dbPathInput: string): LoadedState {
  return loadState(dbPathInput);
}

export function normalize(dbPathInput: string): { ok: boolean; issues: string[] } {
  initDatabase(resolveDbPath(dbPathInput));
  return { ok: true, issues: [] };
}

export function writeAffair(dbPathInput: string, payload: Partial<Affair> & Pick<Affair, "id" | "title">, lastSeenModifiedAt?: string): Affair {
  const dbPath = resolveDbPath(dbPathInput);
  if (lastSeenModifiedAt && detectConflict(dbPath, lastSeenModifiedAt)) {
    throw new Error("Database changed externally. Refresh required.");
  }

  const db = openDb(dbPath);
  try {
    ensureDomain(db, payload.domainId ?? "general");
    const exists = db.prepare("SELECT id FROM affairs WHERE id=?").get(payload.id) as { id: string } | undefined;
    if (exists) {
      db.prepare(
        `UPDATE affairs SET domain_id=?, title=?, timeline=?, stakes=?, risk=?, fragility_score=?, status=?, completion_pct=?, updated_at=datetime('now') WHERE id=?`
      ).run(
        payload.domainId ?? "general",
        payload.title,
        payload.timeline ?? null,
        payload.stakes ?? 0,
        payload.risk ?? 0,
        (payload.stakes ?? 0) * (payload.risk ?? 0),
        payload.status ?? "NOT_STARTED",
        payload.completionPct ?? 0,
        payload.id
      );
    } else {
      db.prepare(
        `INSERT INTO affairs (id, domain_id, title, timeline, stakes, risk, fragility_score, status, completion_pct) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(
        payload.id,
        payload.domainId ?? "general",
        payload.title,
        payload.timeline ?? null,
        payload.stakes ?? 0,
        payload.risk ?? 0,
        (payload.stakes ?? 0) * (payload.risk ?? 0),
        payload.status ?? "NOT_STARTED",
        payload.completionPct ?? 0
      );
    }
  } finally {
    db.close();
  }

  return {
    id: payload.id,
    domainId: payload.domainId ?? "general",
    title: payload.title,
    timeline: payload.timeline,
    stakes: payload.stakes ?? 0,
    risk: payload.risk ?? 0,
    fragilityScore: (payload.stakes ?? 0) * (payload.risk ?? 0),
    status: (payload.status ?? "NOT_STARTED") as Affair["status"],
    completionPct: payload.completionPct ?? 0
  };
}

export function writeInterest(dbPathInput: string, payload: Partial<Interest> & Pick<Interest, "id" | "title">, lastSeenModifiedAt?: string): Interest {
  const dbPath = resolveDbPath(dbPathInput);
  if (lastSeenModifiedAt && detectConflict(dbPath, lastSeenModifiedAt)) {
    throw new Error("Database changed externally. Refresh required.");
  }

  const db = openDb(dbPath);
  try {
    ensureDomain(db, payload.domainId ?? "general");
    const exists = db.prepare("SELECT id FROM interests WHERE id=?").get(payload.id) as { id: string } | undefined;
    if (exists) {
      db.prepare(
        `UPDATE interests SET domain_id=?, title=?, stakes=?, risk=?, asymmetry=?, upside=?, downside=?, convexity=?, status=?, notes=?, updated_at=datetime('now') WHERE id=?`
      ).run(
        payload.domainId ?? "general",
        payload.title,
        payload.stakes ?? 0,
        payload.risk ?? 0,
        payload.asymmetry ?? null,
        payload.upside ?? null,
        payload.downside ?? null,
        payload.convexity ?? 0,
        payload.status ?? "NOT_STARTED",
        payload.notes ?? null,
        payload.id
      );
    } else {
      db.prepare(
        `INSERT INTO interests (id, domain_id, title, stakes, risk, asymmetry, upside, downside, convexity, status, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(
        payload.id,
        payload.domainId ?? "general",
        payload.title,
        payload.stakes ?? 0,
        payload.risk ?? 0,
        payload.asymmetry ?? null,
        payload.upside ?? null,
        payload.downside ?? null,
        payload.convexity ?? 0,
        payload.status ?? "NOT_STARTED",
        payload.notes ?? null
      );
    }
  } finally {
    db.close();
  }

  return {
    id: payload.id,
    domainId: payload.domainId ?? "general",
    title: payload.title,
    stakes: payload.stakes ?? 0,
    risk: payload.risk ?? 0,
    convexity: payload.convexity ?? 0,
    asymmetry: payload.asymmetry,
    upside: payload.upside,
    downside: payload.downside,
    status: (payload.status ?? "NOT_STARTED") as Interest["status"],
    notes: payload.notes
  };
}

export function writeTask(dbPathInput: string, payload: Partial<Task> & Pick<Task, "id" | "title" | "sourceType" | "sourceId">, existingTasks: Task[], lastSeenModifiedAt?: string): Task {
  const dbPath = resolveDbPath(dbPathInput);
  if (lastSeenModifiedAt && detectConflict(dbPath, lastSeenModifiedAt)) {
    throw new Error("Database changed externally. Refresh required.");
  }

  if (payload.status === "DONE") {
    const task = {
      id: payload.id,
      sourceType: payload.sourceType,
      sourceId: payload.sourceId,
      dependencyIds: payload.dependencyIds ?? [],
      title: payload.title,
      horizon: payload.horizon ?? "WEEK",
      status: payload.status,
      dueDate: payload.dueDate,
      effortEstimate: payload.effortEstimate
    } as Task;

    const taskMap = new Map(existingTasks.map((item) => [item.id, item]));
    taskMap.set(task.id, task);
    if (!taskCanBeDone(task, taskMap)) {
      throw new Error("Task dependencies are not completed.");
    }
  }

  const db = openDb(dbPath);
  try {
    const exists = db.prepare("SELECT id FROM tasks WHERE id=?").get(payload.id) as { id: string } | undefined;
    if (exists) {
      db.prepare(
        `UPDATE tasks SET source_type=?, source_id=?, parent_task_id=?, title=?, notes=?, horizon=?, due_date=?, status=?, effort_estimate=?, updated_at=datetime('now') WHERE id=?`
      ).run(
        payload.sourceType,
        payload.sourceId,
        payload.parentTaskId ?? null,
        payload.title,
        payload.notes ?? null,
        payload.horizon ?? "WEEK",
        payload.dueDate ?? null,
        payload.status ?? "NOT_STARTED",
        payload.effortEstimate ?? null,
        payload.id
      );
    } else {
      db.prepare(
        `INSERT INTO tasks (id, source_type, source_id, parent_task_id, title, notes, horizon, due_date, status, effort_estimate)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(
        payload.id,
        payload.sourceType,
        payload.sourceId,
        payload.parentTaskId ?? null,
        payload.title,
        payload.notes ?? null,
        payload.horizon ?? "WEEK",
        payload.dueDate ?? null,
        payload.status ?? "NOT_STARTED",
        payload.effortEstimate ?? null
      );
    }

    db.prepare("DELETE FROM task_dependencies WHERE task_id=?").run(payload.id);
    const depStmt = db.prepare("INSERT OR IGNORE INTO task_dependencies(task_id, dependency_task_id) VALUES (?, ?)");
    for (const depId of payload.dependencyIds ?? []) {
      depStmt.run(payload.id, depId);
    }
  } finally {
    db.close();
  }

  return {
    id: payload.id,
    sourceType: payload.sourceType,
    sourceId: payload.sourceId,
    parentTaskId: payload.parentTaskId,
    dependencyIds: payload.dependencyIds ?? [],
    title: payload.title,
    notes: payload.notes,
    horizon: payload.horizon ?? "WEEK",
    dueDate: payload.dueDate,
    status: (payload.status ?? "NOT_STARTED") as Task["status"],
    effortEstimate: payload.effortEstimate
  };
}
