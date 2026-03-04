import { NextResponse } from "next/server";
import { z } from "zod";
import { loadState, normalize, refreshIfStale, writeAffair, writeInterest, writeTask } from "@khal/sync-engine";
import Database from "better-sqlite3";
import { initDatabase, resolveDbPath } from "@khal/sqlite-core";
import { randomUUID } from "node:crypto";
import { readSettings } from "./settings";

type AnyRow = Record<string, unknown>;

const affairSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(1),
  domainId: z.string().optional(),
  timeline: z.string().optional(),
  stakes: z.number().min(0).max(10).optional(),
  risk: z.number().min(0).max(10).optional(),
  status: z.enum(["NOT_STARTED", "IN_PROGRESS", "DONE", "PARKED", "WAITING"]).optional(),
  completionPct: z.number().min(0).max(100).optional(),
  lastSeenModifiedAt: z.string().optional()
});

const interestSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(1),
  domainId: z.string().optional(),
  stakes: z.number().min(0).max(10).optional(),
  risk: z.number().min(0).max(10).optional(),
  convexity: z.number().min(0).max(10).optional(),
  asymmetry: z.string().optional(),
  upside: z.string().optional(),
  downside: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(["NOT_STARTED", "IN_PROGRESS", "DONE", "PARKED", "WAITING"]).optional(),
  lastSeenModifiedAt: z.string().optional()
});

const taskSchema = z.object({
  id: z.string().uuid().optional(),
  sourceType: z.enum(["AFFAIR", "INTEREST", "PLAN", "PREPARATION"]),
  sourceId: z.string().min(1),
  parentTaskId: z.string().optional(),
  title: z.string().min(1),
  notes: z.string().optional(),
  status: z.enum(["NOT_STARTED", "IN_PROGRESS", "DONE", "PARKED", "WAITING"]).optional(),
  dependencyIds: z.array(z.string()).optional(),
  horizon: z.enum(["WEEK", "MONTH", "QUARTER", "YEAR"]).optional(),
  dueDate: z.string().optional(),
  effortEstimate: z.number().optional(),
  lastSeenModifiedAt: z.string().optional()
});

export async function withStore<T>(fn: (dbPath: string) => Promise<T> | T): Promise<T> {
  const settings = await readSettings();
  return fn(settings.dbPath);
}

export async function withDb<T>(fn: (db: Database.Database, dbPath: string) => Promise<T> | T): Promise<T> {
  const settings = await readSettings();
  const dbPath = resolveDbPath(settings.dbPath);
  initDatabase(dbPath);
  const db = new Database(dbPath);
  try {
    return await fn(db, dbPath);
  } finally {
    db.close();
  }
}

export function ok(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

function extractTopStackFrame(stack?: string): string | undefined {
  if (!stack) return undefined;
  return stack.split("\n").map((value) => value.trim()).find((value) => value.startsWith("at "));
}

export function fail(error: unknown, status = 400) {
  const traceId = randomUUID();
  const message = error instanceof Error ? error.message : "Unknown error";
  const payload: Record<string, unknown> = { error: message, traceId };

  if (process.env.NODE_ENV !== "production") {
    payload.debug = {
      topStackFrame: error instanceof Error ? extractTopStackFrame(error.stack) : undefined
    };
  }

  console.error("[khal-api-error]", { traceId, status, message, stack: error instanceof Error ? error.stack : undefined });
  return NextResponse.json(payload, { status });
}

export async function handleState() {
  return withStore((dbPath) => ok(loadState(dbPath)));
}

function toMonolithAppData(payload: ReturnType<typeof loadState>) {
  const state = payload.state as any;
  const user = {
    name: "Operator",
    birthDate: "2002-09-30T00:00:00.000Z",
    lifeExpectancy: 80,
    location: "Unknown"
  };
  const strategyMatrix = {
    allies: 50,
    enemies: 50,
    overt: 50,
    covert: 50,
    offense: 10,
    defense: 90,
    conventional: 70,
    unconventional: 30
  };

  const domains = (state.domains ?? []).map((domain: any) => {
    const row = (state.warRoomNarrative?.blocks ?? []).find((item: any) => item?.kv?.domain === domain.name);
    const volatilitySourceName = domain.volatilitySourceName ?? row?.heading ?? "Unknown Volatility";
    return {
      id: domain.id,
      name: domain.name,
      lawId: domain.lawId ?? domain.volatilitySourceId ?? domain.id,
      volatilitySourceId: domain.volatilitySourceId ?? null,
      volatilitySourceName,
      volatility: domain.volatility ?? volatilitySourceName,
      volatilitySource: domain.volatilitySource ?? volatilitySourceName,
      stakesText: domain.stakesText ?? row?.kv?.stakes ?? "Undefined",
      risksText: domain.risksText ?? row?.kv?.risks ?? "Undefined",
      fragilityText: domain.fragilityText ?? row?.kv?.fragility ?? "Undefined",
      vulnerabilitiesText: domain.vulnerabilitiesText ?? row?.kv?.vulnerabilities ?? "Undefined",
      hedge: domain.hedge ?? row?.bullets?.[0] ?? "Define hedge",
      edge: domain.edge ?? row?.bullets?.[1] ?? "Define edge",
      heuristics: domain.heuristics ?? row?.bullets?.[2] ?? "Define heuristics",
      tactics: domain.tactics ?? row?.bullets?.[3] ?? "Define tactics",
      interestsText: domain.interestsText ?? row?.bullets?.[4] ?? "",
      affairsText: domain.affairsText ?? row?.bullets?.[5] ?? ""
    };
  });

  const laws = (state.laws ?? []).map((law: any) => ({
    id: law.id,
    name: law.name,
    description: law.description ?? "",
    volatilitySource: law.volatilitySource ?? "",
    associatedCrafts: law.associatedCrafts ?? []
  }));

  const interests = (state.interests ?? []).map((interest: any) => ({
    ...interest,
    perspective: interest.perspective ?? "macro",
    objectives: Array.isArray(interest.objectives) ? interest.objectives : []
  }));

  const affairs = (state.affairs ?? []).map((affair: any) => ({
    ...affair,
    perspective: affair.perspective ?? "macro",
    status: String(affair.status ?? "planning").toLowerCase(),
    context: affair.context ?? { associatedDomains: [affair.domainId].filter(Boolean), volatilityExposure: affair.description ?? "Operational volatility" },
    means: affair.means ?? { craftId: "", selectedHeuristicIds: [] },
    plan: affair.plan ?? { objectives: [], uncertainty: "Unknown", timeHorizon: "Unknown" },
    strategy: affair.strategy ?? { posture: "defense", positioning: "conventional", mapping: { allies: [], enemies: [] } },
    entities: affair.entities ?? []
  }));

  const tasks = (state.tasks ?? []).map((task: any) => ({
    sourceType: task.sourceType ?? "PLAN",
    sourceId: task.sourceId ?? "",
    parentTaskId: task.parentTaskId ?? undefined,
    dependencyIds: Array.isArray(task.dependencyIds) ? task.dependencyIds : [],
    horizon: task.horizon ?? "WEEK",
    dueDate: task.dueDate ?? undefined,
    notes: task.notes ?? undefined,
    id: task.id,
    title: task.title,
    domainId:
      task.sourceType === "AFFAIR"
        ? affairs.find((affair: any) => affair.id === task.sourceId)?.domainId ?? "general"
        : task.sourceType === "INTEREST"
          ? interests.find((interest: any) => interest.id === task.sourceId)?.domainId ?? "general"
          : "general",
    type: String(task.sourceType ?? "").toLowerCase(),
    priority: typeof task.effortEstimate === "number" ? Math.min(100, Math.max(1, Math.round(task.effortEstimate))) : 50,
    progress: task.status === "DONE" ? 100 : task.status === "IN_PROGRESS" ? 50 : 0,
    status: task.status === "DONE" ? "done" : task.status === "IN_PROGRESS" ? "in_progress" : "not_started",
    convexity: 0
  }));

  return {
    user,
    strategyMatrix,
    laws,
    domains,
    interests,
    affairs,
    crafts: state.crafts ?? [],
    tasks,
    sources: (state.sources ?? []).map((source: any) => ({
      id: source.id,
      code: source.code,
      name: source.name,
      sortOrder: source.sortOrder ?? 0,
      domainCount: Array.isArray(source.domains) ? source.domains.length : 0,
      domains: (source.domains ?? []).map((link: any) => ({
        id: link.id,
        sourceId: link.sourceId,
        domainId: link.domainId,
        dependencyKind: link.dependencyKind,
        pathWeight: link.pathWeight ?? 1
      }))
    })),
    missionGraph: state.missionGraph ?? { nodes: [], dependencies: [] },
    lineages: state.lineages ?? { nodes: [], entities: [] },
    lineageRisks: state.lineageRisks ?? [],
    doctrine: state.doctrine ?? { rulebooks: [], rules: [], domainPnLLadders: [] },
    decisionAcceleration: {
      virtueSpiral: payload.dashboard.virtueSpiral,
      pathComparator: payload.dashboard.pathComparator,
      copilot: payload.dashboard.copilot
    },
    decisionAccelerationMeta: payload.dashboard.decisionAccelerationMeta,
    tripwire: payload.dashboard.tripwire,
    ruinLedger: payload.dashboard.ruinLedger,
    violationFeed: payload.dashboard.violationFeed,
    latency: payload.dashboard.latency,
    counterfactual: payload.dashboard.counterfactual,
    confidence: payload.dashboard.confidence,
    optionalityBudget: payload.dashboard.optionalityBudget,
    fragilityTimeline: payload.dashboard.fragilityTimeline,
    decisionReplay: payload.dashboard.decisionReplay,
    blastRadius: payload.dashboard.blastRadius,
    missionBottlenecks: payload.dashboard.missionBottlenecks,
    hedgeCoverage: payload.dashboard.hedgeCoverage,
    convexityPipeline: payload.dashboard.convexityPipeline,
    outcomeAttribution: payload.dashboard.outcomeAttribution,
    assumptions: payload.dashboard.assumptions,
    recoveryPlaybooks: payload.dashboard.recoveryPlaybooks
  };
}

export async function handleData() {
  return withStore((dbPath) => ok(toMonolithAppData(loadState(dbPath))));
}

export async function handleRefresh() {
  return withStore((dbPath) => ok(refreshIfStale(dbPath)));
}

export async function handleNormalize() {
  return withStore((dbPath) => ok(normalize(dbPath)));
}

export async function handleAffair(rawBody: unknown) {
  const parsed = affairSchema.parse(rawBody);
  const id = parsed.id ?? randomUUID();
  return withStore((dbPath) => ok(writeAffair(dbPath, { ...parsed, id }, parsed.lastSeenModifiedAt), parsed.id ? 200 : 201));
}

export async function handleInterest(rawBody: unknown) {
  const parsed = interestSchema.parse(rawBody);
  const id = parsed.id ?? randomUUID();
  return withStore((dbPath) => ok(writeInterest(dbPath, { ...parsed, id }, parsed.lastSeenModifiedAt), parsed.id ? 200 : 201));
}

export async function handleTask(rawBody: unknown) {
  const parsed = taskSchema.parse(rawBody);
  const id = parsed.id ?? randomUUID();

  return withStore((dbPath) => {
    const loaded = loadState(dbPath);
    return ok(writeTask(dbPath, { ...parsed, id }, loaded.state.tasks, parsed.lastSeenModifiedAt), parsed.id ? 200 : 201);
  });
}

const craftSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1),
  description: z.string().optional()
});

const craftEntitySchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().optional(),
  name: z.string().optional(),
  description: z.string().optional(),
  type: z.string().optional(),
  url: z.string().optional(),
  notes: z.string().optional(),
  hedge: z.string().optional(),
  edge: z.string().optional(),
  content: z.string().optional(),
  heapIds: z.array(z.string()).optional(),
  modelIds: z.array(z.string()).optional(),
  frameworkIds: z.array(z.string()).optional(),
  barbellStrategyIds: z.array(z.string()).optional()
});

function replaceLinks(db: Database.Database, table: string, sourceColumn: string, sourceId: string, targetColumn: string, targetIds: string[]) {
  db.prepare(`DELETE FROM ${table} WHERE ${sourceColumn}=?`).run(sourceId);
  const stmt = db.prepare(`INSERT INTO ${table} (${sourceColumn}, ${targetColumn}, sort_order) VALUES (?, ?, ?)`);
  targetIds.forEach((targetId, index) => stmt.run(sourceId, targetId, index));
}

function mapCraft(db: Database.Database, craftId: string) {
  const craft = db.prepare("SELECT * FROM crafts WHERE id=?").get(craftId) as any;
  if (!craft) return null;

  const heaps = db.prepare("SELECT * FROM craft_heaps WHERE craft_id=? ORDER BY sort_order, created_at").all(craftId) as any[];
  const models = db.prepare("SELECT * FROM craft_models WHERE craft_id=? ORDER BY sort_order, created_at").all(craftId) as any[];
  const frameworks = db.prepare("SELECT * FROM craft_frameworks WHERE craft_id=? ORDER BY sort_order, created_at").all(craftId) as any[];
  const barbells = db.prepare("SELECT * FROM craft_barbell_strategies WHERE craft_id=? ORDER BY sort_order, created_at").all(craftId) as any[];
  const heuristics = db.prepare("SELECT * FROM craft_heuristics WHERE craft_id=? ORDER BY sort_order, created_at").all(craftId) as any[];

  const modelHeapLinks = db.prepare("SELECT model_id, heap_id FROM craft_model_heap_links").all() as Array<{ model_id: string; heap_id: string }>;
  const frameworkModelLinks = db.prepare("SELECT framework_id, model_id FROM craft_framework_model_links").all() as Array<{ framework_id: string; model_id: string }>;
  const barbellFrameworkLinks = db.prepare("SELECT barbell_id, framework_id FROM craft_barbell_framework_links").all() as Array<{ barbell_id: string; framework_id: string }>;
  const heuristicBarbellLinks = db.prepare("SELECT heuristic_id, barbell_id FROM craft_heuristic_barbell_links").all() as Array<{ heuristic_id: string; barbell_id: string }>;

  const map = (rows: Array<{ source: string; target: string }>) => {
    const out = new Map<string, string[]>();
    for (const row of rows) {
      const current = out.get(row.source) ?? [];
      current.push(row.target);
      out.set(row.source, current);
    }
    return out;
  };

  const heapsByModel = map(modelHeapLinks.map((row) => ({ source: row.model_id, target: row.heap_id })));
  const modelsByFramework = map(frameworkModelLinks.map((row) => ({ source: row.framework_id, target: row.model_id })));
  const frameworksByBarbell = map(barbellFrameworkLinks.map((row) => ({ source: row.barbell_id, target: row.framework_id })));
  const barbellsByHeuristic = map(heuristicBarbellLinks.map((row) => ({ source: row.heuristic_id, target: row.barbell_id })));

  return {
    id: craft.id,
    name: craft.name,
    description: craft.description ?? undefined,
    heaps: heaps.map((row) => ({ id: row.id, title: row.title, type: row.type, url: row.url ?? undefined, notes: row.notes ?? undefined })),
    models: models.map((row) => ({ id: row.id, title: row.title, description: row.description ?? undefined, heapIds: heapsByModel.get(row.id) ?? [] })),
    frameworks: frameworks.map((row) => ({ id: row.id, title: row.title, description: row.description ?? undefined, modelIds: modelsByFramework.get(row.id) ?? [] })),
    barbellStrategies: barbells.map((row) => ({
      id: row.id,
      title: row.title,
      hedge: row.hedge ?? undefined,
      edge: row.edge ?? undefined,
      frameworkIds: frameworksByBarbell.get(row.id) ?? []
    })),
    heuristics: heuristics.map((row) => ({
      id: row.id,
      title: row.title,
      content: row.content ?? undefined,
      barbellStrategyIds: barbellsByHeuristic.get(row.id) ?? []
    }))
  };
}

export async function handleCrafts() {
  return withDb((db) => {
    const ids = db.prepare("SELECT id FROM crafts ORDER BY name").all() as Array<{ id: string }>;
    const crafts = ids.map((row) => mapCraft(db, row.id)).filter(Boolean);
    return ok(crafts);
  });
}

export async function handleCraft(rawBody: unknown, craftId?: string) {
  const parsed = craftSchema.parse(rawBody);
  const id = craftId ?? parsed.id ?? randomUUID();
  return withDb((db) => {
    const exists = db.prepare("SELECT id FROM crafts WHERE id=?").get(id) as { id: string } | undefined;
    if (exists) {
      db.prepare("UPDATE crafts SET name=?, description=?, updated_at=datetime('now') WHERE id=?").run(parsed.name, parsed.description ?? null, id);
    } else {
      db.prepare("INSERT INTO crafts (id, name, description) VALUES (?, ?, ?)").run(id, parsed.name, parsed.description ?? null);
    }
    return ok(mapCraft(db, id), exists ? 200 : 201);
  });
}

export async function handleCraftById(craftId: string) {
  return withDb((db) => {
    const craft = mapCraft(db, craftId);
    if (!craft) return ok({ error: "Craft not found" }, 404);
    return ok(craft);
  });
}

export async function handleCraftEntity(craftId: string, type: "heaps" | "models" | "frameworks" | "barbell-strategies" | "heuristics", rawBody: unknown, entityId?: string) {
  const parsed = craftEntitySchema.parse(rawBody);
  const id = entityId ?? parsed.id ?? randomUUID();
  return withDb((db) => {
    const normalizedType = type === "barbell-strategies" ? "barbellStrategies" : type;

    if (normalizedType === "heaps") {
      const exists = db.prepare("SELECT id FROM craft_heaps WHERE id=?").get(id) as { id: string } | undefined;
      if (exists) {
        db.prepare("UPDATE craft_heaps SET title=?, type=?, url=?, notes=?, updated_at=datetime('now') WHERE id=?").run(
          parsed.title ?? parsed.name ?? "Untitled Heap",
          parsed.type ?? "link",
          parsed.url ?? null,
          parsed.notes ?? null,
          id
        );
      } else {
        db.prepare("INSERT INTO craft_heaps (id, craft_id, title, type, url, notes) VALUES (?, ?, ?, ?, ?, ?)").run(
          id,
          craftId,
          parsed.title ?? parsed.name ?? "Untitled Heap",
          parsed.type ?? "link",
          parsed.url ?? null,
          parsed.notes ?? null
        );
      }
      return ok({ id, craftId, title: parsed.title ?? parsed.name, type: parsed.type ?? "link", url: parsed.url }, exists ? 200 : 201);
    }

    if (normalizedType === "models") {
      const exists = db.prepare("SELECT id FROM craft_models WHERE id=?").get(id) as { id: string } | undefined;
      if (exists) {
        db.prepare("UPDATE craft_models SET title=?, description=?, updated_at=datetime('now') WHERE id=?").run(
          parsed.title ?? parsed.name ?? "Untitled Model",
          parsed.description ?? null,
          id
        );
      } else {
        db.prepare("INSERT INTO craft_models (id, craft_id, title, description) VALUES (?, ?, ?, ?)").run(
          id,
          craftId,
          parsed.title ?? parsed.name ?? "Untitled Model",
          parsed.description ?? null
        );
      }
      replaceLinks(db, "craft_model_heap_links", "model_id", id, "heap_id", parsed.heapIds ?? []);
      return ok({ id, craftId, title: parsed.title ?? parsed.name, description: parsed.description, heapIds: parsed.heapIds ?? [] }, exists ? 200 : 201);
    }

    if (normalizedType === "frameworks") {
      const exists = db.prepare("SELECT id FROM craft_frameworks WHERE id=?").get(id) as { id: string } | undefined;
      if (exists) {
        db.prepare("UPDATE craft_frameworks SET title=?, description=?, updated_at=datetime('now') WHERE id=?").run(
          parsed.title ?? parsed.name ?? "Untitled Framework",
          parsed.description ?? null,
          id
        );
      } else {
        db.prepare("INSERT INTO craft_frameworks (id, craft_id, title, description) VALUES (?, ?, ?, ?)").run(
          id,
          craftId,
          parsed.title ?? parsed.name ?? "Untitled Framework",
          parsed.description ?? null
        );
      }
      replaceLinks(db, "craft_framework_model_links", "framework_id", id, "model_id", parsed.modelIds ?? []);
      return ok({ id, craftId, title: parsed.title ?? parsed.name, description: parsed.description, modelIds: parsed.modelIds ?? [] }, exists ? 200 : 201);
    }

    if (normalizedType === "barbellStrategies") {
      const exists = db.prepare("SELECT id FROM craft_barbell_strategies WHERE id=?").get(id) as { id: string } | undefined;
      if (exists) {
        db.prepare("UPDATE craft_barbell_strategies SET title=?, hedge=?, edge=?, updated_at=datetime('now') WHERE id=?").run(
          parsed.title ?? parsed.name ?? "Untitled Barbell",
          parsed.hedge ?? null,
          parsed.edge ?? null,
          id
        );
      } else {
        db.prepare("INSERT INTO craft_barbell_strategies (id, craft_id, title, hedge, edge) VALUES (?, ?, ?, ?, ?)").run(
          id,
          craftId,
          parsed.title ?? parsed.name ?? "Untitled Barbell",
          parsed.hedge ?? null,
          parsed.edge ?? null
        );
      }
      replaceLinks(db, "craft_barbell_framework_links", "barbell_id", id, "framework_id", parsed.frameworkIds ?? []);
      return ok({ id, craftId, title: parsed.title ?? parsed.name, hedge: parsed.hedge, edge: parsed.edge, frameworkIds: parsed.frameworkIds ?? [] }, exists ? 200 : 201);
    }

    const exists = db.prepare("SELECT id FROM craft_heuristics WHERE id=?").get(id) as { id: string } | undefined;
    if (exists) {
      db.prepare("UPDATE craft_heuristics SET title=?, content=?, updated_at=datetime('now') WHERE id=?").run(
        parsed.title ?? parsed.name ?? "Untitled Heuristic",
        parsed.content ?? null,
        id
      );
    } else {
      db.prepare("INSERT INTO craft_heuristics (id, craft_id, title, content) VALUES (?, ?, ?, ?)").run(
        id,
        craftId,
        parsed.title ?? parsed.name ?? "Untitled Heuristic",
        parsed.content ?? null
      );
    }
    replaceLinks(db, "craft_heuristic_barbell_links", "heuristic_id", id, "barbell_id", parsed.barbellStrategyIds ?? []);
    return ok({ id, craftId, title: parsed.title ?? parsed.name, content: parsed.content, barbellStrategyIds: parsed.barbellStrategyIds ?? [] }, exists ? 200 : 201);
  });
}

export async function handleCraftLinks(
  table: "craft_model_heap_links" | "craft_framework_model_links" | "craft_barbell_framework_links" | "craft_heuristic_barbell_links",
  sourceColumn: string,
  sourceId: string,
  targetColumn: string,
  targetIds: string[]
) {
  return withDb((db) => {
    replaceLinks(db, table, sourceColumn, sourceId, targetColumn, targetIds);
    return ok({ sourceId, targetIds });
  });
}

const affairMeansSchema = z.object({
  craftId: z.string().min(1),
  selectedHeuristicIds: z.array(z.string()).default([]),
  methodology: z.string().optional(),
  technology: z.string().optional(),
  techniques: z.string().optional()
});

export async function handleAffairMeans(affairId: string, rawBody: unknown) {
  const parsed = affairMeansSchema.parse(rawBody);
  return withDb((db) => {
    const craftExists = db.prepare("SELECT id FROM crafts WHERE id=?").get(parsed.craftId) as { id: string } | undefined;
    if (!craftExists) {
      db.prepare("INSERT INTO crafts (id, name, description) VALUES (?, ?, ?)").run(parsed.craftId, parsed.craftId, "Auto-created craft");
    }
    const exists = db.prepare("SELECT affair_id FROM affair_means WHERE affair_id=?").get(affairId) as { affair_id: string } | undefined;
    if (exists) {
      db.prepare("UPDATE affair_means SET craft_id=?, methodology=?, technology=?, techniques=?, updated_at=datetime('now') WHERE affair_id=?").run(
        parsed.craftId,
        parsed.methodology ?? null,
        parsed.technology ?? null,
        parsed.techniques ?? null,
        affairId
      );
    } else {
      db.prepare("INSERT INTO affair_means (affair_id, craft_id, methodology, technology, techniques) VALUES (?, ?, ?, ?, ?)").run(
        affairId,
        parsed.craftId,
        parsed.methodology ?? null,
        parsed.technology ?? null,
        parsed.techniques ?? null
      );
    }

    db.prepare("DELETE FROM affair_selected_heuristics WHERE affair_id=?").run(affairId);
    const stmt = db.prepare("INSERT INTO affair_selected_heuristics (affair_id, heuristic_id) VALUES (?, ?)");
    parsed.selectedHeuristicIds.forEach((heuristicId) => stmt.run(affairId, heuristicId));

    return ok(parsed);
  });
}

const affairPlanSchema = z.object({
  objectives: z.array(z.string()).default([]),
  uncertainty: z.string().optional(),
  timeHorizon: z.string().optional()
});

const timeHorizonProfileSchema = z.object({
  focusText: z.string().optional(),
  dobIso: z.string().optional(),
  lifeExpectancyYears: z.number().int().min(1).max(130).optional()
});

const timeHorizonDeadlineCreateSchema = z.object({
  label: z.string().min(1),
  dueAt: z.string().min(1)
});

const timeHorizonDeadlineUpdateSchema = z.object({
  label: z.string().min(1).optional(),
  dueAt: z.string().min(1).optional(),
  sortOrder: z.number().int().optional()
});

const domainStrategySchema = z.object({
  stakesText: z.string().optional(),
  risksText: z.string().optional(),
  fragilityText: z.string().optional(),
  vulnerabilitiesText: z.string().optional(),
  hedgeText: z.string().optional(),
  edgeText: z.string().optional(),
  heuristicsText: z.string().optional(),
  tacticsText: z.string().optional(),
  interestsText: z.string().optional(),
  affairsText: z.string().optional()
});

const missionHierarchyNodeSchema = z.object({
  id: z.string().optional(),
  refType: z.enum(["MISSION", "SOURCE", "DOMAIN", "END", "AFFAIR", "INTEREST", "LINEAGE", "TASK"]),
  refId: z.string().min(1),
  parentNodeId: z.string().nullable().optional(),
  sortOrder: z.number().int().optional(),
  dependencyIds: z.array(z.string()).default([])
});

const missionHierarchySchema = z.object({
  missionId: z.string().min(1),
  nodes: z.array(missionHierarchyNodeSchema).default([])
});

const sourceMapLinkSchema = z.object({
  sourceId: z.string().min(1),
  domainId: z.string().min(1),
  dependencyKind: z.enum(["PRIMARY", "SECONDARY", "CASCADE"]).default("PRIMARY"),
  pathWeight: z.number().min(0).default(1)
});

const lineageNodeSchema = z.object({
  id: z.string().optional(),
  level: z.enum(["SELF", "FAMILY", "STATE", "NATION", "HUMANITY", "NATURE"]),
  name: z.string().min(1),
  parentId: z.string().nullable().optional(),
  sortOrder: z.number().int().optional()
});

const lineageEntitySchema = z.object({
  id: z.string().optional(),
  lineageNodeId: z.string().min(1),
  actorType: z.enum(["personal", "private", "public"]),
  label: z.string().min(1),
  description: z.string().optional()
});

const lineageRiskSchema = z.object({
  id: z.string().optional(),
  sourceId: z.string().min(1),
  domainId: z.string().min(1),
  lineageNodeId: z.string().min(1),
  actorType: z.enum(["personal", "private", "public"]).optional(),
  title: z.string().min(1),
  exposure: z.number().min(1).max(10).default(5),
  dependency: z.number().min(1).max(10).default(5),
  irreversibility: z.number().min(1).max(10).default(5),
  optionality: z.number().min(1).max(10).default(5),
  responseTime: z.number().positive().default(7),
  status: z.enum(["OPEN", "MITIGATING", "RESOLVED", "INCOMPLETE"]).default("INCOMPLETE"),
  notes: z.string().optional()
});

function ensureTimeHorizonProfile(db: Database.Database, userKey: string) {
  const existing = db.prepare("SELECT user_key FROM time_horizon_profiles WHERE user_key=?").get(userKey) as { user_key: string } | undefined;
  if (existing) return;
  db.prepare(
    "INSERT INTO time_horizon_profiles (user_key, focus_text, dob_iso, life_expectancy_years) VALUES (?, ?, ?, ?)"
  ).run(userKey, "define your north star", "2002-09-30T00:00:00.000Z", 80);
}

function parseJsonOrDefault<T>(value: unknown, fallback: T): T {
  if (typeof value !== "string" || !value.trim()) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function computeResponseTimeModifier(responseTime: number): number {
  if (responseTime <= 1) return 0.8;
  if (responseTime <= 7) return 1.0;
  if (responseTime <= 30) return 1.2;
  return 1.5;
}

function computeTalebFragilityScore(input: {
  exposure: number;
  dependency: number;
  irreversibility: number;
  optionality: number;
  responseTime: number;
}): number {
  const safeOptionality = Math.max(0.1, input.optionality);
  const base = (input.exposure * input.dependency * input.irreversibility) / safeOptionality;
  const score = base * computeResponseTimeModifier(input.responseTime);
  return Number(score.toFixed(4));
}

function toIcsUtc(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

function escapeIcsText(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
}

export async function handleTimeHorizonGet(userKey = "default_operator") {
  return withDb((db) => {
    ensureTimeHorizonProfile(db, userKey);
    const profile = db.prepare("SELECT * FROM time_horizon_profiles WHERE user_key=?").get(userKey) as AnyRow;
    const deadlines = db
      .prepare("SELECT id, label, due_at, sort_order FROM time_horizon_deadlines WHERE user_key=? ORDER BY due_at, sort_order")
      .all(userKey) as AnyRow[];
    return ok({
      userKey,
      profile: {
        focusText: profile?.focus_text ? String(profile.focus_text) : "",
        dobIso: profile?.dob_iso ? String(profile.dob_iso) : "2002-09-30T00:00:00.000Z",
        lifeExpectancyYears: Number(profile?.life_expectancy_years ?? 80)
      },
      deadlines: deadlines.map((row) => ({
        id: String(row.id),
        label: String(row.label),
        dueAt: String(row.due_at),
        sortOrder: Number(row.sort_order ?? 0)
      }))
    });
  });
}

export async function handleTimeHorizonProfile(rawBody: unknown, userKey = "default_operator") {
  const parsed = timeHorizonProfileSchema.parse(rawBody);
  return withDb((db) => {
    ensureTimeHorizonProfile(db, userKey);
    db.prepare(
      `UPDATE time_horizon_profiles
       SET focus_text = COALESCE(?, focus_text),
           dob_iso = COALESCE(?, dob_iso),
           life_expectancy_years = COALESCE(?, life_expectancy_years),
           updated_at = datetime('now')
       WHERE user_key=?`
    ).run(parsed.focusText ?? null, parsed.dobIso ?? null, parsed.lifeExpectancyYears ?? null, userKey);
    return handleTimeHorizonGet(userKey);
  });
}

export async function handleTimeHorizonDeadlineCreate(rawBody: unknown, userKey = "default_operator") {
  const parsed = timeHorizonDeadlineCreateSchema.parse(rawBody);
  return withDb((db) => {
    ensureTimeHorizonProfile(db, userKey);
    const id = randomUUID();
    const sortOrder = Number(
      (db.prepare("SELECT COALESCE(MAX(sort_order), -1) AS max_sort FROM time_horizon_deadlines WHERE user_key=?").get(userKey) as AnyRow)?.max_sort ?? -1
    ) + 1;
    db.prepare("INSERT INTO time_horizon_deadlines (id, user_key, label, due_at, sort_order) VALUES (?, ?, ?, ?, ?)").run(
      id,
      userKey,
      parsed.label,
      parsed.dueAt,
      sortOrder
    );
    return ok({ id, label: parsed.label, dueAt: parsed.dueAt, sortOrder }, 201);
  });
}

export async function handleTimeHorizonDeadlineUpdate(deadlineId: string, rawBody: unknown, userKey = "default_operator") {
  const parsed = timeHorizonDeadlineUpdateSchema.parse(rawBody);
  return withDb((db) => {
    const exists = db.prepare("SELECT id FROM time_horizon_deadlines WHERE id=? AND user_key=?").get(deadlineId, userKey) as { id: string } | undefined;
    if (!exists) return ok({ error: "Deadline not found" }, 404);
    db.prepare(
      `UPDATE time_horizon_deadlines
       SET label = COALESCE(?, label),
           due_at = COALESCE(?, due_at),
           sort_order = COALESCE(?, sort_order),
           updated_at = datetime('now')
       WHERE id=? AND user_key=?`
    ).run(parsed.label ?? null, parsed.dueAt ?? null, parsed.sortOrder ?? null, deadlineId, userKey);
    const row = db.prepare("SELECT id, label, due_at, sort_order FROM time_horizon_deadlines WHERE id=?").get(deadlineId) as AnyRow;
    return ok({
      id: String(row.id),
      label: String(row.label),
      dueAt: String(row.due_at),
      sortOrder: Number(row.sort_order ?? 0)
    });
  });
}

export async function handleTimeHorizonDeadlineDelete(deadlineId: string, userKey = "default_operator") {
  return withDb((db) => {
    db.prepare("DELETE FROM time_horizon_deadlines WHERE id=? AND user_key=?").run(deadlineId, userKey);
    return ok({ ok: true });
  });
}

export async function handleCalendarIcs(query?: { horizon?: string }) {
  return withDb((db) => {
    const params: unknown[] = [];
    let taskSql = "SELECT id, source_type, source_id, title, notes, horizon, due_date, status, updated_at FROM tasks WHERE due_date IS NOT NULL";
    if (query?.horizon) {
      taskSql += " AND horizon=?";
      params.push(query.horizon);
    }
    taskSql += " ORDER BY due_date";
    const tasks = db.prepare(taskSql).all(...params) as AnyRow[];
    const deadlines = db
      .prepare("SELECT id, label, due_at, updated_at FROM time_horizon_deadlines WHERE user_key=? ORDER BY due_at")
      .all("default_operator") as AnyRow[];

    const dtstamp = toIcsUtc(new Date());
    const lines: string[] = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//KHAL//WarRoom Calendar//EN",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      "X-WR-CALNAME:KHAL Execution",
      "X-WR-TIMEZONE:UTC"
    ];

    for (const row of tasks) {
      const due = new Date(String(row.due_date));
      if (Number.isNaN(due.getTime())) continue;
      const end = new Date(due.getTime() + 30 * 60 * 1000);
      const uid = `task-${row.id}@khal`;
      const summary = `[TASK] ${String(row.title)}`;
      const description = `Source: ${String(row.source_type)}/${String(row.source_id)}\\nHorizon: ${String(row.horizon ?? "WEEK")}\\nStatus: ${String(row.status ?? "NOT_STARTED")}${
        row.notes ? `\\nNotes: ${String(row.notes)}` : ""
      }`;
      lines.push("BEGIN:VEVENT");
      lines.push(`UID:${uid}`);
      lines.push(`DTSTAMP:${dtstamp}`);
      lines.push(`DTSTART:${toIcsUtc(due)}`);
      lines.push(`DTEND:${toIcsUtc(end)}`);
      lines.push(`SUMMARY:${escapeIcsText(summary)}`);
      lines.push(`DESCRIPTION:${escapeIcsText(description)}`);
      lines.push("END:VEVENT");
    }

    for (const row of deadlines) {
      const due = new Date(String(row.due_at));
      if (Number.isNaN(due.getTime())) continue;
      const end = new Date(due.getTime() + 60 * 60 * 1000);
      const uid = `deadline-${row.id}@khal`;
      lines.push("BEGIN:VEVENT");
      lines.push(`UID:${uid}`);
      lines.push(`DTSTAMP:${dtstamp}`);
      lines.push(`DTSTART:${toIcsUtc(due)}`);
      lines.push(`DTEND:${toIcsUtc(end)}`);
      lines.push(`SUMMARY:${escapeIcsText(`[DEADLINE] ${String(row.label)}`)}`);
      lines.push("END:VEVENT");
    }

    lines.push("END:VCALENDAR");

    return new NextResponse(lines.join("\r\n"), {
      status: 200,
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": "inline; filename=\"khal.ics\"",
        "Cache-Control": "no-store"
      }
    });
  });
}

export async function handleAffairPlan(affairId: string, rawBody: unknown) {
  const parsed = affairPlanSchema.parse(rawBody);
  return withDb((db) => {
    const exists = db.prepare("SELECT affair_id FROM affair_plan_details WHERE affair_id=?").get(affairId) as { affair_id: string } | undefined;
    if (exists) {
      db.prepare(
        `UPDATE affair_plan_details
         SET objectives_json=?, uncertainty=?, time_horizon=?, updated_at=datetime('now')
         WHERE affair_id=?`
      ).run(JSON.stringify(parsed.objectives ?? []), parsed.uncertainty ?? null, parsed.timeHorizon ?? null, affairId);
    } else {
      db.prepare(
        `INSERT INTO affair_plan_details (affair_id, objectives_json, uncertainty, time_horizon, updated_at)
         VALUES (?, ?, ?, ?, datetime('now'))`
      ).run(affairId, JSON.stringify(parsed.objectives ?? []), parsed.uncertainty ?? null, parsed.timeHorizon ?? null);
    }
    return ok(parsed);
  });
}

export async function handleVolatilitySources() {
  return withDb((db) => {
    const rows = db
      .prepare(
        `SELECT s.id, s.code, s.name, s.sort_order, COUNT(d.id) AS domain_count
         FROM volatility_sources s
         LEFT JOIN volatility_source_domain_links l ON l.source_id = s.id
         LEFT JOIN domains d ON d.id = l.domain_id
         GROUP BY s.id, s.code, s.name, s.sort_order
         ORDER BY s.sort_order, s.name`
      )
      .all() as AnyRow[];
    return ok(
      rows.map((row) => ({
        id: String(row.id),
        code: String(row.code),
        name: String(row.name),
        sortOrder: Number(row.sort_order ?? 0),
        domainCount: Number(row.domain_count ?? 0)
      }))
    );
  });
}

export async function handleDomainStrategyGet(domainId: string) {
  return withDb((db) => {
    const domain = db.prepare("SELECT id FROM domains WHERE id=?").get(domainId) as { id: string } | undefined;
    if (!domain) return ok({ error: "Domain not found" }, 404);
    const row = db.prepare("SELECT * FROM domain_strategy_details WHERE domain_id=?").get(domainId) as AnyRow | undefined;
    return ok({
      domainId,
      stakesText: row?.stakes_text ? String(row.stakes_text) : "",
      risksText: row?.risks_text ? String(row.risks_text) : "",
      fragilityText: row?.fragility_text ? String(row.fragility_text) : "",
      vulnerabilitiesText: row?.vulnerabilities_text ? String(row.vulnerabilities_text) : "",
      hedgeText: row?.hedge_text ? String(row.hedge_text) : "",
      edgeText: row?.edge_text ? String(row.edge_text) : "",
      heuristicsText: row?.heuristics_text ? String(row.heuristics_text) : "",
      tacticsText: row?.tactics_text ? String(row.tactics_text) : "",
      interestsText: row?.interests_text ? String(row.interests_text) : "",
      affairsText: row?.affairs_text ? String(row.affairs_text) : ""
    });
  });
}

export async function handleDomainStrategyPut(domainId: string, rawBody: unknown) {
  const parsed = domainStrategySchema.parse(rawBody);
  return withDb((db) => {
    const domain = db.prepare("SELECT id FROM domains WHERE id=?").get(domainId) as { id: string } | undefined;
    if (!domain) return ok({ error: "Domain not found" }, 404);
    const exists = db.prepare("SELECT domain_id FROM domain_strategy_details WHERE domain_id=?").get(domainId) as { domain_id: string } | undefined;
    if (exists) {
      db.prepare(
        `UPDATE domain_strategy_details
         SET stakes_text=COALESCE(?, stakes_text),
             risks_text=COALESCE(?, risks_text),
             fragility_text=COALESCE(?, fragility_text),
             vulnerabilities_text=COALESCE(?, vulnerabilities_text),
             hedge_text=COALESCE(?, hedge_text),
             edge_text=COALESCE(?, edge_text),
             heuristics_text=COALESCE(?, heuristics_text),
             tactics_text=COALESCE(?, tactics_text),
             interests_text=COALESCE(?, interests_text),
             affairs_text=COALESCE(?, affairs_text),
             updated_at=datetime('now')
         WHERE domain_id=?`
      ).run(
        parsed.stakesText ?? null,
        parsed.risksText ?? null,
        parsed.fragilityText ?? null,
        parsed.vulnerabilitiesText ?? null,
        parsed.hedgeText ?? null,
        parsed.edgeText ?? null,
        parsed.heuristicsText ?? null,
        parsed.tacticsText ?? null,
        parsed.interestsText ?? null,
        parsed.affairsText ?? null,
        domainId
      );
    } else {
      db.prepare(
        `INSERT INTO domain_strategy_details
         (domain_id, stakes_text, risks_text, fragility_text, vulnerabilities_text, hedge_text, edge_text, heuristics_text, tactics_text, interests_text, affairs_text)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(
        domainId,
        parsed.stakesText ?? null,
        parsed.risksText ?? null,
        parsed.fragilityText ?? null,
        parsed.vulnerabilitiesText ?? null,
        parsed.hedgeText ?? null,
        parsed.edgeText ?? null,
        parsed.heuristicsText ?? null,
        parsed.tacticsText ?? null,
        parsed.interestsText ?? null,
        parsed.affairsText ?? null
      );
    }
    return handleDomainStrategyGet(domainId);
  });
}

export async function handleSourceMap() {
  return withDb((db) => {
    const sources = db
      .prepare("SELECT id, code, name, sort_order FROM volatility_sources ORDER BY sort_order, name")
      .all() as AnyRow[];
    const domains = db.prepare("SELECT id, name FROM domains ORDER BY name").all() as AnyRow[];
    const links = db
      .prepare(
        `SELECT id, source_id, domain_id, dependency_kind, path_weight
         FROM volatility_source_domain_links
         ORDER BY source_id, dependency_kind, path_weight DESC`
      )
      .all() as AnyRow[];
    const domainById = new Map(domains.map((domain) => [String(domain.id), domain]));
    return ok(
      sources.map((source) => {
        const sourceId = String(source.id);
        return {
          id: sourceId,
          code: String(source.code),
          name: String(source.name),
          sortOrder: Number(source.sort_order ?? 0),
          domains: links
            .filter((link) => String(link.source_id) === sourceId)
            .map((link) => ({
              id: String(link.id),
              sourceId,
              domainId: String(link.domain_id),
              domainName: String(domainById.get(String(link.domain_id))?.name ?? link.domain_id),
              dependencyKind: String(link.dependency_kind ?? "PRIMARY"),
              pathWeight: Number(link.path_weight ?? 1)
            }))
        };
      })
    );
  });
}

export async function handleLineages() {
  return withDb((db) => {
    const nodes = db
      .prepare("SELECT id, level, name, parent_id, sort_order FROM lineage_nodes ORDER BY sort_order, name")
      .all() as AnyRow[];
    const entities = db
      .prepare("SELECT id, lineage_node_id, actor_type, label, description FROM lineage_entities ORDER BY created_at")
      .all() as AnyRow[];
    return ok({
      nodes: nodes.map((row) => ({
        id: String(row.id),
        level: String(row.level),
        name: String(row.name),
        parentId: row.parent_id ? String(row.parent_id) : undefined,
        sortOrder: Number(row.sort_order ?? 0)
      })),
      entities: entities.map((row) => ({
        id: String(row.id),
        lineageNodeId: String(row.lineage_node_id),
        actorType: String(row.actor_type),
        label: String(row.label),
        description: row.description ? String(row.description) : undefined
      }))
    });
  });
}

export async function handleLineageNodeCreate(rawBody: unknown) {
  const parsed = lineageNodeSchema.parse(rawBody);
  return withDb((db) => {
    const id = parsed.id ?? randomUUID();
    const sortOrder =
      parsed.sortOrder ??
      Number((db.prepare("SELECT COALESCE(MAX(sort_order), 0) AS max_sort FROM lineage_nodes").get() as AnyRow)?.max_sort ?? 0) + 1;
    db.prepare(
      `INSERT INTO lineage_nodes (id, level, name, parent_id, sort_order)
       VALUES (?, ?, ?, ?, ?)`
    ).run(id, parsed.level, parsed.name, parsed.parentId ?? null, sortOrder);
    return ok({ id, level: parsed.level, name: parsed.name, parentId: parsed.parentId ?? undefined, sortOrder }, 201);
  });
}

export async function handleLineageNodePatch(nodeId: string, rawBody: unknown) {
  const parsed = lineageNodeSchema.partial().parse(rawBody);
  return withDb((db) => {
    const exists = db.prepare("SELECT id FROM lineage_nodes WHERE id=?").get(nodeId) as { id: string } | undefined;
    if (!exists) return ok({ error: "Lineage node not found" }, 404);
    db.prepare(
      `UPDATE lineage_nodes
       SET level=COALESCE(?, level),
           name=COALESCE(?, name),
           parent_id=CASE WHEN ? THEN ? ELSE parent_id END,
           sort_order=COALESCE(?, sort_order),
           updated_at=datetime('now')
       WHERE id=?`
    ).run(
      parsed.level ?? null,
      parsed.name ?? null,
      parsed.parentId !== undefined ? 1 : 0,
      parsed.parentId ?? null,
      parsed.sortOrder ?? null,
      nodeId
    );
    const row = db.prepare("SELECT id, level, name, parent_id, sort_order FROM lineage_nodes WHERE id=?").get(nodeId) as AnyRow;
    return ok({
      id: String(row.id),
      level: String(row.level),
      name: String(row.name),
      parentId: row.parent_id ? String(row.parent_id) : undefined,
      sortOrder: Number(row.sort_order ?? 0)
    });
  });
}

export async function handleLineageEntityCreate(rawBody: unknown) {
  const parsed = lineageEntitySchema.parse(rawBody);
  return withDb((db) => {
    const id = parsed.id ?? randomUUID();
    db.prepare(
      `INSERT INTO lineage_entities (id, lineage_node_id, actor_type, label, description)
       VALUES (?, ?, ?, ?, ?)`
    ).run(id, parsed.lineageNodeId, parsed.actorType, parsed.label, parsed.description ?? null);
    return ok({ id, ...parsed }, 201);
  });
}

export async function handleLineageEntityPatch(entityId: string, rawBody: unknown) {
  const parsed = lineageEntitySchema.partial().parse(rawBody);
  return withDb((db) => {
    const exists = db.prepare("SELECT id FROM lineage_entities WHERE id=?").get(entityId) as { id: string } | undefined;
    if (!exists) return ok({ error: "Lineage entity not found" }, 404);
    db.prepare(
      `UPDATE lineage_entities
       SET lineage_node_id=COALESCE(?, lineage_node_id),
           actor_type=COALESCE(?, actor_type),
           label=COALESCE(?, label),
           description=COALESCE(?, description),
           updated_at=datetime('now')
       WHERE id=?`
    ).run(parsed.lineageNodeId ?? null, parsed.actorType ?? null, parsed.label ?? null, parsed.description ?? null, entityId);
    const row = db.prepare("SELECT id, lineage_node_id, actor_type, label, description FROM lineage_entities WHERE id=?").get(entityId) as AnyRow;
    return ok({
      id: String(row.id),
      lineageNodeId: String(row.lineage_node_id),
      actorType: String(row.actor_type),
      label: String(row.label),
      description: row.description ? String(row.description) : undefined
    });
  });
}

export async function handleLineageRisks(query?: {
  sourceId?: string;
  domainId?: string;
  lineageNodeId?: string;
  actorType?: string;
  status?: string;
}) {
  return withDb((db) => {
    const clauses: string[] = [];
    const params: Array<string> = [];
    if (query?.sourceId) {
      clauses.push("r.source_id=?");
      params.push(query.sourceId);
    }
    if (query?.domainId) {
      clauses.push("r.domain_id=?");
      params.push(query.domainId);
    }
    if (query?.lineageNodeId) {
      clauses.push("r.lineage_node_id=?");
      params.push(query.lineageNodeId);
    }
    if (query?.status) {
      clauses.push("r.status=?");
      params.push(query.status);
    }
    if (query?.actorType) {
      clauses.push("e.actor_type=?");
      params.push(query.actorType);
    }
    const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
    const rows = db
      .prepare(
        `SELECT r.*, e.actor_type
         FROM lineage_risk_register r
         LEFT JOIN lineage_entities e ON e.lineage_node_id = r.lineage_node_id
         ${where}
         ORDER BY r.updated_at DESC, r.created_at DESC`
      )
      .all(...params) as AnyRow[];
    return ok(
      rows.map((row) => ({
        id: String(row.id),
        sourceId: String(row.source_id),
        domainId: String(row.domain_id),
        lineageNodeId: String(row.lineage_node_id),
        actorType: row.actor_type ? String(row.actor_type) : undefined,
        title: String(row.title),
        exposure: Number(row.exposure ?? 5),
        dependency: Number(row.dependency ?? 5),
        irreversibility: Number(row.irreversibility ?? 5),
        optionality: Number(row.optionality ?? 5),
        responseTime: Number(row.response_time ?? 7),
        fragilityScore: Number(row.fragility_score ?? 0),
        status: String(row.status ?? "INCOMPLETE"),
        notes: row.notes ? String(row.notes) : undefined
      }))
    );
  });
}

export async function handleLineageRiskCreate(rawBody: unknown) {
  const parsed = lineageRiskSchema.parse(rawBody);
  return withDb((db) => {
    const id = parsed.id ?? randomUUID();
    const fragilityScore = computeTalebFragilityScore({
      exposure: parsed.exposure,
      dependency: parsed.dependency,
      irreversibility: parsed.irreversibility,
      optionality: parsed.optionality,
      responseTime: parsed.responseTime
    });
    db.prepare(
      `INSERT INTO lineage_risk_register
      (id, source_id, domain_id, lineage_node_id, title, exposure, dependency, irreversibility, optionality, response_time, fragility_score, status, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      id,
      parsed.sourceId,
      parsed.domainId,
      parsed.lineageNodeId,
      parsed.title,
      parsed.exposure,
      parsed.dependency,
      parsed.irreversibility,
      parsed.optionality,
      parsed.responseTime,
      fragilityScore,
      parsed.status,
      parsed.notes ?? null
    );
    return ok({ id, ...parsed, fragilityScore }, 201);
  });
}

export async function handleLineageRiskPatch(riskId: string, rawBody: unknown) {
  const parsed = lineageRiskSchema.partial().parse(rawBody);
  return withDb((db) => {
    const existing = db
      .prepare(
        `SELECT source_id, domain_id, lineage_node_id, title, exposure, dependency, irreversibility, optionality, response_time, status, notes
         FROM lineage_risk_register WHERE id=?`
      )
      .get(riskId) as AnyRow | undefined;
    if (!existing) return ok({ error: "Lineage risk not found" }, 404);

    const merged = {
      sourceId: parsed.sourceId ?? String(existing.source_id),
      domainId: parsed.domainId ?? String(existing.domain_id),
      lineageNodeId: parsed.lineageNodeId ?? String(existing.lineage_node_id),
      title: parsed.title ?? String(existing.title),
      exposure: parsed.exposure ?? Number(existing.exposure ?? 5),
      dependency: parsed.dependency ?? Number(existing.dependency ?? 5),
      irreversibility: parsed.irreversibility ?? Number(existing.irreversibility ?? 5),
      optionality: parsed.optionality ?? Number(existing.optionality ?? 5),
      responseTime: parsed.responseTime ?? Number(existing.response_time ?? 7),
      status: parsed.status ?? String(existing.status ?? "INCOMPLETE"),
      notes: parsed.notes ?? (existing.notes ? String(existing.notes) : undefined)
    };
    const fragilityScore = computeTalebFragilityScore(merged);

    db.prepare(
      `UPDATE lineage_risk_register
       SET source_id=?, domain_id=?, lineage_node_id=?, title=?, exposure=?, dependency=?, irreversibility=?, optionality=?, response_time=?, fragility_score=?, status=?, notes=?, updated_at=datetime('now')
       WHERE id=?`
    ).run(
      merged.sourceId,
      merged.domainId,
      merged.lineageNodeId,
      merged.title,
      merged.exposure,
      merged.dependency,
      merged.irreversibility,
      merged.optionality,
      merged.responseTime,
      fragilityScore,
      merged.status,
      merged.notes ?? null,
      riskId
    );

    return ok({ id: riskId, ...merged, fragilityScore });
  });
}

function missionRootNodeId(missionId: string): string {
  return `mission-root-${missionId}`;
}

export async function handleMissionHierarchyGet(missionId: string) {
  const rootId = missionRootNodeId(missionId);
  return withDb((db) => {
    const rows = db
      .prepare(
        `WITH RECURSIVE subtree AS (
           SELECT id, ref_type, ref_id, parent_node_id, sort_order
           FROM mission_nodes
           WHERE id=?
           UNION ALL
           SELECT n.id, n.ref_type, n.ref_id, n.parent_node_id, n.sort_order
           FROM mission_nodes n
           JOIN subtree s ON n.parent_node_id=s.id
         )
         SELECT id, ref_type, ref_id, parent_node_id, sort_order
         FROM subtree
         WHERE id <> ?
         ORDER BY sort_order, id`
      )
      .all(rootId, rootId) as AnyRow[];

    const nodeIds = new Set(rows.map((row) => String(row.id)));
    const dependencies = db
      .prepare("SELECT mission_node_id, depends_on_node_id FROM mission_dependencies")
      .all() as Array<{ mission_node_id: string; depends_on_node_id: string }>;

    return ok({
      missionId,
      nodes: rows.map((row) => ({
        id: String(row.id),
        missionId,
        refType: String(row.ref_type),
        refId: String(row.ref_id),
        parentNodeId: row.parent_node_id ? String(row.parent_node_id) : undefined,
        sortOrder: Number(row.sort_order ?? 0)
      })),
      dependencies: dependencies
        .filter((dep) => nodeIds.has(dep.mission_node_id) && nodeIds.has(dep.depends_on_node_id))
        .map((dep) => ({
          missionNodeId: dep.mission_node_id,
          dependsOnNodeId: dep.depends_on_node_id
        }))
    });
  });
}

export async function handleMissionHierarchyPut(missionId: string, rawBody: unknown) {
  const body = typeof rawBody === "object" && rawBody !== null ? (rawBody as Record<string, unknown>) : {};
  const parsed = missionHierarchySchema.parse({
    ...body,
    missionId
  });
  const rootId = missionRootNodeId(parsed.missionId);

  return withDb((db) => {
    const nodeIdMap = new Map<string, string>();
    parsed.nodes.forEach((node, index) => {
      const generated = node.id ?? randomUUID();
      nodeIdMap.set(node.id ?? `@${index}`, generated);
      if (node.id) nodeIdMap.set(node.id, generated);
    });

    const normalizedNodes = parsed.nodes.map((node, index) => {
      const key = node.id ?? `@${index}`;
      const id = nodeIdMap.get(key)!;
      const parentNodeId = node.parentNodeId ? nodeIdMap.get(node.parentNodeId) ?? rootId : rootId;
      return {
        id,
        refType: node.refType,
        refId: node.refId,
        parentNodeId,
        sortOrder: node.sortOrder ?? index + 1,
        dependencyIds: node.dependencyIds
          .map((dependencyId) => nodeIdMap.get(dependencyId) ?? dependencyId)
          .filter((dependencyId) => dependencyId !== id)
      };
    });

    const normalizedIds = new Set(normalizedNodes.map((node) => node.id));
    db.exec("BEGIN");
    try {
      db.prepare(
        `WITH RECURSIVE subtree(id) AS (
           SELECT id FROM mission_nodes WHERE id=?
           UNION ALL
           SELECT n.id FROM mission_nodes n JOIN subtree s ON n.parent_node_id=s.id
         )
         DELETE FROM mission_dependencies
         WHERE mission_node_id IN (SELECT id FROM subtree) OR depends_on_node_id IN (SELECT id FROM subtree)`
      ).run(rootId);
      db.prepare(
        `WITH RECURSIVE subtree(id) AS (
           SELECT id FROM mission_nodes WHERE id=?
           UNION ALL
           SELECT n.id FROM mission_nodes n JOIN subtree s ON n.parent_node_id=s.id
         )
         DELETE FROM mission_nodes WHERE id IN (SELECT id FROM subtree)`
      ).run(rootId);

      db.prepare(
        `INSERT INTO mission_nodes (id, ref_type, ref_id, parent_node_id, sort_order, updated_at)
         VALUES (?, 'MISSION', ?, NULL, 0, datetime('now'))
         ON CONFLICT(id) DO UPDATE SET
           ref_type='MISSION',
           ref_id=excluded.ref_id,
           parent_node_id=NULL,
           sort_order=0,
           updated_at=datetime('now')`
      ).run(rootId, parsed.missionId);

      const insertNode = db.prepare(
        `INSERT INTO mission_nodes (id, ref_type, ref_id, parent_node_id, sort_order, updated_at)
         VALUES (?, ?, ?, ?, ?, datetime('now'))
         ON CONFLICT(id) DO UPDATE SET
           ref_type=excluded.ref_type,
           ref_id=excluded.ref_id,
           parent_node_id=excluded.parent_node_id,
           sort_order=excluded.sort_order,
           updated_at=datetime('now')`
      );
      const insertDependency = db.prepare(
        "INSERT OR IGNORE INTO mission_dependencies (mission_node_id, depends_on_node_id, created_at) VALUES (?, ?, datetime('now'))"
      );

      for (const node of normalizedNodes) {
        insertNode.run(node.id, node.refType, node.refId, node.parentNodeId, node.sortOrder);
      }
      for (const node of normalizedNodes) {
        for (const dependencyId of node.dependencyIds) {
          if (!normalizedIds.has(dependencyId)) continue;
          insertDependency.run(node.id, dependencyId);
        }
      }
      db.exec("COMMIT");
    } catch (error) {
      db.exec("ROLLBACK");
      throw error;
    }

    return handleMissionHierarchyGet(parsed.missionId);
  });
}
