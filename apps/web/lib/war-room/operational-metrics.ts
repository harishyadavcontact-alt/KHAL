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
  ExecutionSplitMetrics,
  FragilistaWatchItem,
  HarmSignalSnapshot,
  Interest,
  LabProtocolCheck,
  LabSummaryMetrics,
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

function average(values: number[]): number {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
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

function isHighStakesDomain(domain?: AppData["domains"][number]): boolean {
  const text = `${domain?.stakesText ?? ""} ${domain?.risksText ?? ""}`.toLowerCase();
  return text.includes("high") || text.includes("critical") || text.includes("severe");
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

export function computeHarmSignalSnapshot(input: AppData): HarmSignalSnapshot {
  const openRisks = (input.lineageRisks ?? []).filter((risk) => isOpenRiskStatus(risk.status));
  const sortedByFragility = [...openRisks].sort((left, right) => asNumber(right.fragilityScore, 0) - asNumber(left.fragilityScore, 0));
  const activeAffairs = input.affairs.filter((affair) => isActiveStatus(affair.status));
  const activeTasks = input.tasks.filter((task) => isActiveStatus(task.status));

  const harmFromRisks = average(sortedByFragility.map((risk) => clamp(asNumber(risk.fragilityScore, 0), 0, 100)));
  const harmFromAffairs = average(activeAffairs.map((affair) => affairFragilityMass(affair.stakes, affair.risk)));
  const harmLevel = round1(clamp(harmFromRisks > 0 ? harmFromRisks : harmFromAffairs, 0, 100));

  const now = Date.now();
  const weekFromNow = now + 7 * 24 * 60 * 60 * 1000;
  let overdue = 0;
  let nearTerm = 0;
  let unscheduled = 0;
  for (const task of activeTasks) {
    const dueAt = safeDateTs(task.dueDate);
    if (dueAt === null) {
      unscheduled += 1;
      continue;
    }
    if (dueAt < now) overdue += 1;
    else if (dueAt <= weekFromNow) nearTerm += 1;
  }
  const disorderPressure = round1(
    clamp(
      activeTasks.length ? ((overdue * 3 + nearTerm * 2 + unscheduled) / (activeTasks.length * 3)) * 100 : harmLevel * 0.6,
      0,
      100
    )
  );

  const openCriticalCount = sortedByFragility.filter((risk) => asNumber(risk.fragilityScore, 0) >= 70).length;
  const signalBand: HarmSignalSnapshot["signalBand"] =
    harmLevel >= 70 || disorderPressure >= 70 || openCriticalCount >= 3
      ? "critical"
      : harmLevel >= 45 || disorderPressure >= 45 || openCriticalCount > 0
        ? "watch"
        : "stable";

  const series = (() => {
    if (sortedByFragility.length) {
      return sortedByFragility.slice(0, 8).map((risk, index) => {
        const value = round1(clamp(asNumber(risk.fragilityScore, 0), 0, 100));
        return {
          id: risk.id,
          label: `R${index + 1}`,
          value,
          spike: value >= 70
        };
      });
    }

    const domainProxy = domainFragilityProxy({
      affairs: input.affairs,
      interests: input.interests,
      tasks: input.tasks,
      lineageRisks: input.lineageRisks,
      domains: input.domains
    });
    return Array.from({ length: 8 }, (_, index) => {
      const value = round1(clamp(domainProxy * (0.55 + index * 0.05) + disorderPressure * 0.2 - index * 2, 0, 100));
      return {
        id: `fallback-${index}`,
        label: `T${index + 1}`,
        value,
        spike: value >= 70
      };
    });
  })();

  return {
    harmLevel,
    disorderPressure,
    openCriticalCount,
    signalBand,
    series
  };
}

export function computeFragilistaWatchlist(input: AppData, limit = 5): FragilistaWatchItem[] {
  const domainById = new Map(input.domains.map((domain) => [domain.id, domain]));
  const sourceById = new Map((input.sources ?? []).map((source) => [source.id, source]));

  const actorLabel = (actorType?: string) => {
    const normalized = (actorType ?? "").trim().toLowerCase();
    if (normalized === "personal") return "Personal Actor";
    if (normalized === "private") return "Private Actor";
    if (normalized === "public") return "Public Actor";
    return "Unknown Actor";
  };

  const toItem = (risk: NonNullable<AppData["lineageRisks"]>[number]): FragilistaWatchItem => {
    const exposure = clamp(asNumber(risk.exposure, 5), 0, 10);
    const dependency = clamp(asNumber(risk.dependency, 5), 0, 10);
    const irreversibility = clamp(asNumber(risk.irreversibility, 5), 0, 10);
    const optionality = clamp(asNumber(risk.optionality, 5), 0, 10);
    const responseTime = clamp(asNumber(risk.responseTime, 7), 0, 30);

    const score = round1(
      clamp(
        exposure * 10 * 0.25 +
          dependency * 10 * 0.2 +
          irreversibility * 10 * 0.25 +
          (10 - optionality) * 10 * 0.15 +
          (responseTime / 30) * 100 * 0.15,
        0,
        100
      )
    );

    const sitgBand: FragilistaWatchItem["sitgBand"] = score >= 70 ? "LOW" : score >= 45 ? "MEDIUM" : "HIGH";
    const domainLabel = domainById.get(risk.domainId)?.name ?? risk.domainId;
    const sourceLabel = sourceById.get(risk.sourceId)?.name ?? risk.sourceId;
    const reason =
      sitgBand === "LOW"
        ? "High exposure with weak downside accountability."
        : sitgBand === "MEDIUM"
          ? "Moderate fragility pressure; tighten response commitments."
          : "Accountability posture is stronger than baseline.";

    return {
      id: risk.id,
      title: risk.title,
      entityLabel: actorLabel(risk.actorType),
      domainLabel,
      sourceLabel,
      score,
      sitgBand,
      reason
    };
  };

  return (input.lineageRisks ?? [])
    .filter((risk) => isOpenRiskStatus(risk.status))
    .map(toItem)
    .sort((left, right) => right.score - left.score)
    .slice(0, limit);
}

export function computeExecutionSplit(input: AppData): ExecutionSplitMetrics {
  const activeAffairs = input.affairs.filter((affair) => isActiveStatus(affair.status));
  const closedAffairs = input.affairs.filter((affair) => !isActiveStatus(affair.status));
  const activeInterests = input.interests.filter((interest) => isActiveStatus(interest.status));

  const openFragilityMass = activeAffairs.reduce((sum, affair) => sum + affairFragilityMass(affair.stakes, affair.risk), 0);
  const closedFragilityMass = closedAffairs.reduce((sum, affair) => sum + affairFragilityMass(affair.stakes, affair.risk), 0);
  const totalFragilityMass = openFragilityMass + closedFragilityMass;

  const affairsCompletionPct = round1(input.affairs.length ? (closedAffairs.length / input.affairs.length) * 100 : 0);
  const fragilityReductionProxy = round1(totalFragilityMass ? (closedFragilityMass / totalFragilityMass) * 100 : 0);

  const interestTasks = input.tasks.filter((task) => normalizeSourceType(task.sourceType) === "INTEREST");
  const interestTasksDone = interestTasks.filter((task) => normalizeStatus(task.status) === "DONE").length;
  const interestTasksInProgress = interestTasks.filter((task) => normalizeStatus(task.status) === "IN_PROGRESS").length;
  const interestsExecutionPct = round1(
    interestTasks.length ? ((interestTasksDone + interestTasksInProgress * 0.5) / interestTasks.length) * 100 : 0
  );

  const convexityMass = round1(
    activeInterests.reduce((sum, interest) => sum + interestConvexityMass(interest.convexity, interest.stakes), 0)
  );

  const affairsScore = round1(clamp(fragilityReductionProxy * 0.6 + affairsCompletionPct * 0.4, 0, 100));
  const interestsScore = round1(clamp(clamp(convexityMass, 0, 100) * 0.55 + interestsExecutionPct * 0.45, 0, 100));

  const diff = interestsScore - affairsScore;
  const imbalanceBand: ExecutionSplitMetrics["imbalanceBand"] =
    affairsScore >= 35 && interestsScore >= 35 && affairsScore <= 65 && interestsScore <= 65
      ? "fragile-middle"
      : diff > 20
        ? "interests-heavy"
        : diff < -20
          ? "affairs-heavy"
          : "balanced";

  return {
    affairsScore,
    interestsScore,
    affairsCompletionPct,
    interestsExecutionPct,
    fragilityReductionProxy,
    convexityMass,
    affairsOpenCount: activeAffairs.length,
    interestsActiveCount: activeInterests.length,
    imbalanceBand
  };
}

export function computeInterestAsymmetryScore(interest: Interest): number {
  const convexity = clamp(asNumber(interest.convexity, 0), 0, 10) * 10;
  const maxLoss = clamp(asNumber(interest.maxLossPct, 100), 0, 100);
  const irreversibility = clamp(asNumber(interest.irreversibility, 100), 0, 100);
  const risk = clamp(asNumber(interest.risk, 5), 0, 10) * 10;
  const hedgePct = clamp(asNumber(interest.hedgePct, 0), 0, 100);
  const edgePct = clamp(asNumber(interest.edgePct, 0), 0, 100);

  const downsideCapQuality = 100 - maxLoss;
  const splitDistance = Math.abs(hedgePct - edgePct);
  const barbellShapeQuality = clamp(splitDistance, 0, 100);
  const reversibilityQuality = 100 - irreversibility;

  const raw =
    convexity * 0.35 +
    downsideCapQuality * 0.3 +
    barbellShapeQuality * 0.2 +
    reversibilityQuality * 0.15 -
    risk * 0.1;

  return round1(clamp(raw, 0, 100));
}

export function computeInterestProtocolChecks(interest: Interest, domain?: AppData["domains"][number]): LabProtocolCheck[] {
  const now = Date.now();
  const expiryTs = safeDateTs(interest.expiryDate);
  const killCriteria = (interest.killCriteria ?? []).filter((item) => item.trim().length > 0);
  const hedgePct = clamp(asNumber(interest.hedgePct, 0), 0, 100);
  const edgePct = clamp(asNumber(interest.edgePct, 0), 0, 100);
  const highStakes = isHighStakesDomain(domain);

  return [
    { key: "hypothesis", label: "Hypothesis defined", passed: Boolean(interest.hypothesis && interest.hypothesis.trim()) },
    { key: "max_loss", label: "Max loss declared (0-100)", passed: asNumber(interest.maxLossPct, -1) > 0 && asNumber(interest.maxLossPct, -1) <= 100 },
    { key: "expiry", label: "Expiry date is future", passed: Boolean(expiryTs && expiryTs > now), detail: interest.expiryDate },
    { key: "kill", label: "Kill criteria present", passed: killCriteria.length >= 1 },
    { key: "barbell_sum", label: "Hedge + Edge = 100", passed: Math.abs(hedgePct + edgePct - 100) < 0.001 },
    { key: "hedge_floor", label: highStakes ? "High-stakes hedge >= 70%" : "Hedge floor rule", passed: highStakes ? hedgePct >= 70 : true, detail: highStakes ? `${hedgePct}%` : "not-high-stakes" },
    { key: "irreversibility", label: "Irreversibility declared", passed: interest.irreversibility != null }
  ];
}

export function isInterestProtocolReady(interest: Interest, domain?: AppData["domains"][number]): boolean {
  return computeInterestProtocolChecks(interest, domain).every((check) => check.passed);
}

export function computeLabSummary(input: AppData): LabSummaryMetrics {
  const domainById = new Map(input.domains.map((domain) => [domain.id, domain]));
  const interests = input.interests ?? [];
  if (!interests.length) {
    return {
      protocolIntegrity: 0,
      blockedExperiments: 0,
      averageAsymmetryScore: 0,
      staleOptionalityCount: 0
    };
  }

  const readiness = interests.map((interest) => isInterestProtocolReady(interest, domainById.get(interest.domainId)));
  const asymmetryScores = interests.map((interest) => computeInterestAsymmetryScore(interest));
  const now = Date.now();
  const staleOptionalityCount = interests.filter((interest) => {
    const ts = safeDateTs(interest.expiryDate);
    return ts !== null && ts <= now;
  }).length;

  const blockedExperiments = readiness.filter((value) => !value).length;
  return {
    protocolIntegrity: round1((readiness.filter(Boolean).length / Math.max(1, interests.length)) * 100),
    blockedExperiments,
    averageAsymmetryScore: round1(average(asymmetryScores)),
    staleOptionalityCount
  };
}

export function withLabDerivedFields(input: AppData): AppData {
  const domainById = new Map(input.domains.map((domain) => [domain.id, domain]));
  const interests = input.interests.map((interest) => {
    const asymmetryScore = computeInterestAsymmetryScore(interest);
    const protocolReady = isInterestProtocolReady(interest, domainById.get(interest.domainId));
    return {
      ...interest,
      labStage: interest.labStage ?? "FORGE",
      asymmetryScore,
      protocolReady
    };
  });
  return {
    ...input,
    interests
  };
}
