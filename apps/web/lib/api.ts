import { NextResponse } from "next/server";
import { z } from "zod";
import { loadState, normalize, refreshIfStale, writeAffair, writeInterest, writeTask } from "@khal/sync-engine";
import Database from "better-sqlite3";
import { initDatabase, resolveDbPath } from "@khal/sqlite-core";
import { randomUUID } from "node:crypto";
import { readSettings } from "./settings";

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
  title: z.string().min(1),
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
    return {
      id: domain.id,
      name: domain.name,
      lawId: domain.id,
      volatility: row?.heading ?? "Unknown Volatility",
      volatilitySource: row?.heading ?? "Unknown Volatility",
      stakesText: row?.kv?.stakes ?? "Undefined",
      risksText: row?.kv?.risks ?? "Undefined",
      fragilityText: row?.kv?.fragility ?? "Undefined",
      vulnerabilitiesText: row?.kv?.vulnerabilities ?? "Undefined",
      hedge: row?.bullets?.[0] ?? "Define hedge",
      edge: row?.bullets?.[1] ?? "Define edge",
      heuristics: row?.bullets?.[2] ?? "Define heuristics",
      tactics: row?.bullets?.[3] ?? "Define tactics",
      interestsText: row?.bullets?.[4] ?? "",
      affairsText: row?.bullets?.[5] ?? ""
    };
  });

  const laws = (state.laws ?? []).map((law: any) => ({
    id: law.id,
    name: law.name,
    description: law.description ?? "",
    volatilitySource: law.volatilitySource ?? "",
    associatedCrafts: law.associatedCrafts ?? []
  }));

  return {
    user,
    strategyMatrix,
    laws,
    domains,
    interests: state.interests ?? [],
    affairs: state.affairs ?? [],
    crafts: state.crafts ?? [],
    tasks: state.tasks ?? []
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
