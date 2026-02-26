import { statSync } from "node:fs";
import { rankDoNow, taskCanBeDone, type Affair, type DashboardDoNowItem, type Interest, type KhalState, type Task } from "@khal/domain";
import { loadWorkbookState, normalizeWorkbook, upsertAffair, upsertInterest, upsertTask, validateWorkbook } from "@khal/excel-io";

export interface SyncStatus {
  workbookPath: string;
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

export function loadState(workbookPath: string): LoadedState {
  const validation = validateWorkbook(workbookPath);
  if (!validation.ok) {
    throw new Error(validation.issues.join("; "));
  }

  const loaded = loadWorkbookState(workbookPath);
  const stats = statSync(workbookPath);
  const doNow = rankDoNow(loaded.affairs, loaded.interests, loaded.tasks);

  return {
    state: {
      domains: loaded.domains,
      ends: loaded.ends,
      fragilities: loaded.fragilities,
      affairs: loaded.affairs,
      interests: loaded.interests,
      tasks: loaded.tasks,
      missionNodes: loaded.missionNodes,
      warRoomNarrative: loaded.warRoomNarrative
    },
    dashboard: {
      doNow,
      optionalityIndex: computeOptionality(loaded.interests),
      robustnessProgress: computeRobustnessProgress(loaded.affairs)
    },
    sync: {
      workbookPath,
      modifiedAt: stats.mtime.toISOString(),
      lastLoadedAt: loaded.meta.lastLoadedTimestamp,
      stale: false
    }
  };
}

export function detectConflict(workbookPath: string, lastSeenModifiedAt: string): boolean {
  const modifiedAt = statSync(workbookPath).mtime.toISOString();
  return Boolean(lastSeenModifiedAt) && modifiedAt > lastSeenModifiedAt;
}

export function refreshIfStale(workbookPath: string): LoadedState {
  return loadState(workbookPath);
}

export function normalize(workbookPath: string): { ok: boolean; issues: string[] } {
  const result = normalizeWorkbook(workbookPath);
  return { ok: result.ok, issues: result.issues };
}

export function writeAffair(workbookPath: string, payload: Partial<Affair> & Pick<Affair, "id" | "title">, lastSeenModifiedAt?: string): Affair {
  if (lastSeenModifiedAt && detectConflict(workbookPath, lastSeenModifiedAt)) {
    throw new Error("Workbook changed externally. Refresh required.");
  }
  return upsertAffair(workbookPath, payload);
}

export function writeInterest(workbookPath: string, payload: Partial<Interest> & Pick<Interest, "id" | "title">, lastSeenModifiedAt?: string): Interest {
  if (lastSeenModifiedAt && detectConflict(workbookPath, lastSeenModifiedAt)) {
    throw new Error("Workbook changed externally. Refresh required.");
  }
  return upsertInterest(workbookPath, payload);
}

export function writeTask(workbookPath: string, payload: Partial<Task> & Pick<Task, "id" | "title" | "sourceType" | "sourceId">, existingTasks: Task[], lastSeenModifiedAt?: string): Task {
  if (lastSeenModifiedAt && detectConflict(workbookPath, lastSeenModifiedAt)) {
    throw new Error("Workbook changed externally. Refresh required.");
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

  return upsertTask(workbookPath, payload);
}
