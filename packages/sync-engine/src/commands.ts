import { taskCanBeDone, type Affair, type Interest, type Task } from "@khal/domain";
import { resolveDbPath } from "@khal/sqlite-core";
import { openDb, ensureDomain } from "./db";
import { detectConflict } from "./storage";

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
        `UPDATE interests
         SET domain_id=?, title=?, stakes=?, risk=?, asymmetry=?, upside=?, downside=?, convexity=?, status=?, notes=?,
             lab_stage=?, hypothesis=?, max_loss_pct=?, expiry_date=?, kill_criteria_json=?, hedge_pct=?, edge_pct=?, irreversibility=?, evidence_note=?,
             updated_at=datetime('now')
         WHERE id=?`
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
        payload.labStage ?? "FORGE",
        payload.hypothesis ?? null,
        payload.maxLossPct ?? null,
        payload.expiryDate ?? null,
        JSON.stringify(payload.killCriteria ?? []),
        payload.hedgePct ?? null,
        payload.edgePct ?? null,
        payload.irreversibility ?? null,
        payload.evidenceNote ?? null,
        payload.id
      );
    } else {
      db.prepare(
        `INSERT INTO interests
         (id, domain_id, title, stakes, risk, asymmetry, upside, downside, convexity, status, notes,
          lab_stage, hypothesis, max_loss_pct, expiry_date, kill_criteria_json, hedge_pct, edge_pct, irreversibility, evidence_note)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
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
        payload.notes ?? null,
        payload.labStage ?? "FORGE",
        payload.hypothesis ?? null,
        payload.maxLossPct ?? null,
        payload.expiryDate ?? null,
        JSON.stringify(payload.killCriteria ?? []),
        payload.hedgePct ?? null,
        payload.edgePct ?? null,
        payload.irreversibility ?? null,
        payload.evidenceNote ?? null
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
    notes: payload.notes,
    labStage: payload.labStage ?? "FORGE",
    hypothesis: payload.hypothesis,
    maxLossPct: payload.maxLossPct,
    expiryDate: payload.expiryDate,
    killCriteria: payload.killCriteria ?? [],
    hedgePct: payload.hedgePct,
    edgePct: payload.edgePct,
    irreversibility: payload.irreversibility,
    evidenceNote: payload.evidenceNote
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
