import { existsSync, statSync } from "node:fs";
import Database from "better-sqlite3";
import { randomUUID } from "node:crypto";
import { rankDoNow, taskCanBeDone, type Affair, type DashboardDoNowItem, type Interest, type KhalState, type Task } from "@khal/domain";
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
  if (!existsSync(dbPath)) {
    initDatabase(dbPath);
  }
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

    const affairs = mapAffairs(affairsRows);
    const interests = mapInterests(interestsRows);
    const tasks = mapTasks(taskRows, depsByTask);

    const doNow = rankDoNow(affairs, interests, tasks);
    const stats = statSync(dbPath);

    return {
      state: {
        domains,
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
  if (!existsSync(dbPath)) return false;
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
