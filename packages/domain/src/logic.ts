import type { Affair, DashboardDoNowItem, Interest, Status, Task, TimeHorizon } from "./types";

const statusMap: Record<string, Status> = {
  "NOT STARTED": "NOT_STARTED",
  NOT_STARTED: "NOT_STARTED",
  "IN PROGRESS": "IN_PROGRESS",
  IN_PROGRESS: "IN_PROGRESS",
  DONE: "DONE",
  COMPLETED: "DONE",
  PARKED: "PARKED",
  WAITING: "WAITING"
};

const horizonWeight: Record<TimeHorizon, number> = {
  WEEK: 4,
  MONTH: 3,
  QUARTER: 2,
  YEAR: 1
};

export function clampRange(input: number, min = 0, max = 10): number {
  if (Number.isNaN(input)) return min;
  return Math.max(min, Math.min(max, input));
}

export function normalizeStatus(input: string): Status {
  return statusMap[input.trim().toUpperCase()] ?? "NOT_STARTED";
}

export function computeFragilityScore(stakes: number, risk: number): number {
  return clampRange(stakes, 0, 10) * clampRange(risk, 0, 10);
}

export function computeOptionalityIndex(interests: Interest[]): number {
  return interests.reduce((acc, interest) => acc + clampRange(interest.convexity, 0, 10) * clampRange(interest.stakes, 0, 10), 0);
}

export function taskCanBeDone(task: Task, taskById: Map<string, Task>): boolean {
  if (!task.dependencyIds.length) return true;
  return task.dependencyIds.every((depId) => taskById.get(depId)?.status === "DONE");
}

export function rankDoNow(affairs: Affair[], interests: Interest[], tasks: Task[]): DashboardDoNowItem[] {
  const affairItems: DashboardDoNowItem[] = affairs.map((affair) => {
    const score = computeFragilityScore(affair.stakes, affair.risk);
    return {
      refType: "AFFAIR",
      refId: affair.id,
      title: affair.title,
      score,
      why: `fragility=${score}`
    };
  });

  const taskItems: DashboardDoNowItem[] = tasks.map((task) => {
    const score = horizonWeight[task.horizon] * 10;
    return {
      refType: "TASK",
      refId: task.id,
      title: task.title,
      score,
      why: `horizon=${task.horizon}`
    };
  });

  const interestItems: DashboardDoNowItem[] = interests.map((interest) => {
    const score = clampRange(interest.convexity, 0, 10) * clampRange(interest.stakes, 0, 10);
    return {
      refType: "INTEREST",
      refId: interest.id,
      title: interest.title,
      score,
      why: `convexity*stakes=${score}`
    };
  });

  return [...affairItems, ...taskItems, ...interestItems]
    .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title))
    .slice(0, 10);
}