import { statSync } from "node:fs";
import Database from "better-sqlite3";
import { rankDoNow, taskCanBeDone, type Affair, type Craft, type DashboardDoNowItem, type Interest, type KhalState, type Law, type Task } from "@khal/domain";
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

    const domains = domainRows.map((row) => ({
      id: String(row.id),
      name: String(row.name),
      description: row.description ? String(row.description) : undefined,
      createdAt: String(row.created_at),
      updatedAt: String(row.updated_at)
    }));
    const laws = loadLaws(db);
    const crafts = loadCrafts(db);
    const affairMeans = loadAffairMeans(db);
    const affairs = mapAffairs(affairsRows).map((affair) => {
      const fragilityState = ((affair.fragilityScore ?? 0) > 50 ? "fragile" : "robust") as "fragile" | "robust";
      return {
        ...affair,
        context: {
          associatedDomains: [affair.domainId],
          volatilityExposure: affair.description ?? "Operational volatility"
        },
        means: affairMeans.get(affair.id) ?? (crafts[0] ? { craftId: crafts[0].id, selectedHeuristicIds: [] } : undefined),
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
        missionNodes: [],
        warRoomNarrative: loadWarRoomNarrative(db)
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
    dependencyIds: payload.dependencyIds ?? [],
    title: payload.title,
    horizon: payload.horizon ?? "WEEK",
    dueDate: payload.dueDate,
    status: (payload.status ?? "NOT_STARTED") as Task["status"],
    effortEstimate: payload.effortEstimate
  };
}
