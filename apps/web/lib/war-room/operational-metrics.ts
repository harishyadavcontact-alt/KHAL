import {
  rankDoNow,
  type Affair as DomainAffair,
  type Interest as DomainInterest,
  type Status as DomainStatus,
  type Task as DomainTask
} from "@khal/domain";
import type {
  AppData,
  AsymmetrySnapshot,
  BarbellGuardrailMetrics,
  OperationalNowItem,
  StakeTriadMetrics
} from "../../components/war-room-v2/types";
import { routeForView } from "./routes";

type OperationalInput = Pick<AppData, "affairs" | "interests" | "tasks" | "lineageRisks" | "domains">;

const RESOLVED_STATUS = new Set(["done", "completed", "resolved", "closed", "archived"]);
const OPEN_RISK_STATUS = new Set(["open", "mitigating", "incomplete"]);

function asNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value.trim());
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

function isActiveStatus(status?: string): boolean {
  if (!status) return true;
  return !RESOLVED_STATUS.has(status.trim().toLowerCase());
}

function isOpenRiskStatus(status?: string): boolean {
  if (!status) return true;
  const normalized = status.trim().toLowerCase();
  return OPEN_RISK_STATUS.has(normalized);
}

function normalizeTaskHorizon(horizon?: string): DomainTask["horizon"] {
  const normalized = (horizon ?? "").trim().toUpperCase();
  if (normalized === "MONTH" || normalized === "QUARTER" || normalized === "YEAR") return normalized;
  return "WEEK";
}

function normalizeSourceType(sourceType?: string): DomainTask["sourceType"] {
  const normalized = (sourceType ?? "").trim().toUpperCase();
  if (normalized === "AFFAIR" || normalized === "INTEREST" || normalized === "PLAN" || normalized === "PREPARATION") return normalized;
  return "PLAN";
}

function normalizeStatus(status?: string): DomainStatus {
  const normalized = (status ?? "").trim().toUpperCase();
  if (normalized === "IN_PROGRESS") return "IN_PROGRESS";
  if (normalized === "DONE") return "DONE";
  if (normalized === "PARKED") return "PARKED";
  if (normalized === "WAITING") return "WAITING";
  return "NOT_STARTED";
}

function affairFragilityMass(stakes: unknown, risk: unknown): number {
  const clampedStakes = clamp(asNumber(stakes, 5), 0, 10);
  const clampedRisk = clamp(asNumber(risk, 5), 0, 10);
  return round1(clampedStakes * clampedRisk);
}

function interestConvexityMass(convexity: unknown, stakes: unknown): number {
  const clampedConvexity = clamp(asNumber(convexity, 5), 0, 10);
  const clampedStakes = clamp(asNumber(stakes, 5), 0, 10);
  return round1(clampedConvexity * clampedStakes);
}

function safeDateTs(value?: string): number | null {
  if (!value) return null;
  const ts = Date.parse(value);
  return Number.isFinite(ts) ? ts : null;
}

function domainFragilityProxy(input: OperationalInput): number {
  if (!input.domains.length) return 0;
  const weighted = input.domains.reduce((sum, domain) => {
    const text = `${domain.fragilityText ?? ""} ${domain.risksText ?? ""}`.toLowerCase();
    if (!text.trim()) return sum + 50;
    if (text.includes("critical") || text.includes("fragile") || text.includes("severe") || text.includes("high")) return sum + 80;
    if (text.includes("stable") || text.includes("robust") || text.includes("low")) return sum + 30;
    return sum + 55;
  }, 0);
  return round1(clamp(weighted / input.domains.length, 0, 100));
}

function doNowRoute(refType: OperationalNowItem["refType"], refId: string): string {
  const encodedId = encodeURIComponent(refId);
  if (refType === "AFFAIR") return `${routeForView("affairs")}?focus=${encodedId}`;
  if (refType === "INTEREST") return `${routeForView("interests")}?focus=${encodedId}`;
  return `${routeForView("execution")}?focus=${encodedId}`;
}

function explainWhy(why: string): string {
  if (why.startsWith("fragility=")) return `Fragility pressure ${why.slice("fragility=".length)}`;
  if (why.startsWith("horizon=")) return `Time horizon ${why.slice("horizon=".length)}`;
  if (why.startsWith("convexity*stakes=")) return `Convex payoff score ${why.slice("convexity*stakes=".length)}`;
  return why;
}

function toDomainAffair(input: AppData["affairs"][number]): DomainAffair {
  return {
    id: input.id,
    domainId: input.domainId,
    title: input.title,
    stakes: clamp(asNumber(input.stakes, 5), 0, 10),
    risk: clamp(asNumber(input.risk, 5), 0, 10),
    status: normalizeStatus(input.status),
    completionPct: 0,
    context: input.context
      ? {
          associatedDomains: Array.isArray(input.context.associatedDomains) ? input.context.associatedDomains : [],
          volatilityExposure: input.context.volatilityExposure
        }
      : undefined,
    strategy: input.strategy
      ? {
          posture: input.strategy.posture,
          positioning: input.strategy.positioning,
          mapping: {
            allies: input.strategy.mapping?.allies ?? [],
            enemies: input.strategy.mapping?.enemies ?? []
          }
        }
      : undefined,
    entities: input.entities?.map((entity) => ({
      id: entity.id,
      name: entity.name,
      type: entity.type,
      fragility: entity.fragility === "fragile" || entity.fragility === "robust" || entity.fragility === "antifragile" ? entity.fragility : undefined
    }))
  };
}

function toDomainInterest(input: AppData["interests"][number]): DomainInterest {
  return {
    id: input.id,
    domainId: input.domainId,
    title: input.title,
    stakes: clamp(asNumber(input.stakes, 5), 0, 10),
    risk: clamp(asNumber(input.risk, 5), 0, 10),
    convexity: clamp(asNumber(input.convexity, 5), 0, 10),
    status: normalizeStatus(input.status)
  };
}

function toDomainTask(input: AppData["tasks"][number]): DomainTask {
  return {
    id: input.id,
    sourceType: normalizeSourceType(input.sourceType),
    sourceId: input.sourceId ?? input.id,
    parentTaskId: input.parentTaskId,
    dependencyIds: input.dependencyIds ?? [],
    title: input.title,
    notes: input.notes,
    horizon: normalizeTaskHorizon(input.horizon),
    dueDate: input.dueDate,
    status: normalizeStatus(input.status)
  };
}

export function buildDoNowItems(input: OperationalInput, limit = 5): OperationalNowItem[] {
  const ranked = rankDoNow(input.affairs.map(toDomainAffair), input.interests.map(toDomainInterest), input.tasks.map(toDomainTask));
  return ranked.slice(0, limit).map((item) => ({
    refType: item.refType,
    refId: item.refId,
    title: item.title,
    score: round1(item.score),
    why: explainWhy(item.why),
    route: doNowRoute(item.refType, item.refId)
  }));
}

export function computeStakeTriad(input: OperationalInput): StakeTriadMetrics {
  const now = Date.now();
  const weekFromNow = now + 7 * 24 * 60 * 60 * 1000;
  const openLineageRisks = (input.lineageRisks ?? []).filter((risk) => isOpenRiskStatus(risk.status));
  const activeAffairs = input.affairs.filter((affair) => isActiveStatus(affair.status));
  const activeTasks = input.tasks.filter((task) => isActiveStatus(task.status));

  const lifeScore = (() => {
    if (openLineageRisks.length) {
      const avgLineageFragility =
        openLineageRisks.reduce((sum, risk) => sum + clamp(asNumber(risk.fragilityScore, 0), 0, 100), 0) / openLineageRisks.length;
      return round1(clamp(avgLineageFragility, 0, 100));
    }
    if (activeAffairs.length) {
      const avgAffairFragility =
        activeAffairs.reduce((sum, affair) => sum + affairFragilityMass(affair.stakes, affair.risk), 0) / activeAffairs.length;
      return round1(clamp(avgAffairFragility, 0, 100));
    }
    return domainFragilityProxy(input);
  })();

  let overdueTaskCount = 0;
  let nearTermTaskCount = 0;
  let unscheduledTaskCount = 0;
  let scheduledTaskCount = 0;
  let actionableTaskCount = 0;

  for (const task of activeTasks) {
    const dueAt = safeDateTs(task.dueDate);
    if (dueAt === null) {
      unscheduledTaskCount += 1;
    } else {
      scheduledTaskCount += 1;
      if (dueAt < now) overdueTaskCount += 1;
      else if (dueAt <= weekFromNow) nearTermTaskCount += 1;
    }

    if ((task.sourceId ?? "").trim() && task.title.trim()) actionableTaskCount += 1;
  }

  const weightedTimePressure = overdueTaskCount * 3 + nearTermTaskCount * 2 + unscheduledTaskCount;
  const timeScore = round1(clamp((weightedTimePressure / Math.max(1, activeTasks.length * 3)) * 100, 0, 100));
  const schedulabilityCoverage = round1(activeTasks.length ? (scheduledTaskCount / activeTasks.length) * 100 : 0);
  const actionabilityCoverage = round1(activeTasks.length ? (actionableTaskCount / activeTasks.length) * 100 : 0);
  const soulScore = round1(clamp(schedulabilityCoverage * 0.6 + actionabilityCoverage * 0.4, 0, 100));

  return {
    lifeScore,
    timeScore,
    soulScore,
    openLineageRiskCount: openLineageRisks.length,
    overdueTaskCount,
    nearTermTaskCount,
    unscheduledTaskCount,
    schedulabilityCoverage,
    actionabilityCoverage
  };
}

export function computeBarbellGuardrail(input: OperationalInput): BarbellGuardrailMetrics {
  const activeObligations = input.affairs.filter((affair) => isActiveStatus(affair.status));
  const activeOptions = input.interests.filter((interest) => isActiveStatus(interest.status));

  const hedgeMass = round1(activeObligations.reduce((sum, affair) => sum + affairFragilityMass(affair.stakes, affair.risk), 0));
  const edgeMass = round1(activeOptions.reduce((sum, interest) => sum + interestConvexityMass(interest.convexity, interest.stakes), 0));
  const totalMass = hedgeMass + edgeMass;

  const hedgePct = round1(totalMass > 0 ? (hedgeMass / totalMass) * 100 : 50);
  const edgePct = round1(totalMass > 0 ? (edgeMass / totalMass) * 100 : 50);
  const fragileMiddle = edgePct >= 35 && edgePct <= 65;
  const status: BarbellGuardrailMetrics["status"] = fragileMiddle ? "fragile-middle" : edgePct < 35 ? "hedge-heavy" : "edge-heavy";

  return {
    hedgeMass,
    edgeMass,
    hedgePct,
    edgePct,
    fragileMiddle,
    status,
    activeObligationCount: activeObligations.length,
    activeOptionCount: activeOptions.length
  };
}

export function computeAsymmetrySnapshot(input: OperationalInput): AsymmetrySnapshot {
  const guardrail = computeBarbellGuardrail(input);
  const fragilityMass = round1(guardrail.hedgeMass / Math.max(1, guardrail.activeObligationCount));
  const convexityMass = round1(guardrail.edgeMass / Math.max(1, guardrail.activeOptionCount));
  const balance = clamp(
    round1((convexityMass - fragilityMass) / Math.max(1, convexityMass + fragilityMass)),
    -1,
    1
  );

  const markerX = round1(clamp(((balance + 1) / 2) * 100, 0, 100));
  const markerY = round1(clamp(70 - balance * 30, 10, 90));
  const band: AsymmetrySnapshot["band"] = balance <= -0.2 ? "fragile" : balance >= 0.2 ? "antifragile" : "neutral";

  return {
    markerX,
    markerY,
    balance,
    band,
    convexityMass,
    fragilityMass
  };
}
