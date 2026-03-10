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
    virtueSpiral: {
      stage: "REDUCE_FRAGILITY" | "SECURE_SURVIVAL" | "ASYMMETRIC_BETS" | "GAIN_RESOURCES" | "DOMINANCE";
      score: number;
      trend: "UP" | "STABLE" | "DOWN";
      nextAction: string;
      openFragilityMass: number;
      convexityMass: number;
      executionVelocity: number;
    };
    pathComparator: {
      unpreparedScore: number;
      preparedScore: number;
      delta: number;
      ruinRisk: number;
      survivalOdds: number;
      timeToImpact: number;
      resourceBurn: number;
      criticalNode: string;
    };
    copilot: {
      promptState: string;
      suggestedAction: string;
      rationale: string;
      ctaPayload: {
        title: string;
        sourceType: "AFFAIR" | "INTEREST" | "PLAN" | "PREPARATION";
        sourceId: string;
        horizon: "WEEK" | "MONTH" | "QUARTER" | "YEAR";
        notes: string;
      };
    };
    decisionAccelerationMeta: {
      computedAtIso: string;
      dataQuality: "HIGH" | "MEDIUM" | "LOW";
      invariantViolations: string[];
      fallbackUsed: boolean;
      protocolState: "NOMINAL" | "WATCH" | "CRITICAL";
    };
    tripwire: {
      state: "NOMINAL" | "WATCH" | "BLOCK";
      reason: string;
      recoveryAction: string;
      riskyActionBlocked: boolean;
    };
    ruinLedger: Array<{
      id: string;
      title: string;
      domainId: string;
      sourceId?: string;
      irreversibility: number;
      fragilityScore: number;
      timeToImpactDays: number;
      hedgeStatus: "HEDGED" | "PARTIAL" | "UNHEDGED";
    }>;
    violationFeed: Array<{
      id: string;
      severity: "HARD_GATE" | "SOFT";
      message: string;
      source: string;
      detectedAtIso: string;
    }>;
    latency: {
      signalToQueueMinutes: number;
      signalToQueueBand: "FAST" | "NORMAL" | "SLOW";
    };
    counterfactual: {
      preparedDelta: number;
      unpreparedDelta: number;
      netGain: number;
      note: string;
    };
    confidence: {
      confidence: "HIGH" | "MEDIUM" | "LOW";
      evidenceCount: number;
      recencyMinutes: number;
    };
    optionalityBudget: {
      usedPct: number;
      redlinePct: number;
      canAllocate: boolean;
      rationale: string;
    };
    fragilityTimeline: Array<{
      atIso: string;
      fragility: number;
      convexity: number;
    }>;
    decisionReplay: Array<{
      id: string;
      atIso: string;
      state: string;
      action: string;
      outcome: string;
    }>;
    blastRadius: {
      nodes: Array<{ id: string; label: string; kind: "TASK" | "AFFAIR" | "INTEREST" | "DOMAIN" | "LINEAGE"; risk: number }>;
      edges: Array<{ id: string; from: string; to: string; weight: number }>;
      criticalNodeId?: string;
    };
    missionBottlenecks: Array<{
      id: string;
      title: string;
      domainId?: string;
      backlog: number;
      blockingLoad: number;
      bottleneckScore: number;
    }>;
    hedgeCoverage: Array<{
      riskId: string;
      affairId: string;
      covered: boolean;
    }>;
    convexityPipeline: Array<{
      id: "IDEAS" | "INTERESTS" | "QUEUED" | "EXECUTING" | "OUTCOMES";
      label: string;
      count: number;
    }>;
    outcomeAttribution: {
      skillPct: number;
      luckPct: number;
      regimePct: number;
    };
    assumptions: Array<{
      id: string;
      statement: string;
      stale: boolean;
    }>;
    recoveryPlaybooks: Array<{
      id: string;
      trigger: string;
      firstAction: string;
      owner: string;
    }>;
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

function clampPct(input: number): number {
  if (!Number.isFinite(input)) return 0;
  return Math.max(0, Math.min(100, Number(input.toFixed(2))));
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

function safeNumber(input: unknown, fallback = 0): number {
  return typeof input === "number" && Number.isFinite(input) ? input : fallback;
}

function safeRatio(numerator: number, denominator: number): number {
  const num = safeNumber(numerator, 0);
  const den = safeNumber(denominator, 0);
  if (den <= 0) return 0;
  return num / den;
}

const DOCTRINE_WEIGHTS = {
  affairsToRobustness: 0.45,
  interestsToConvexity: 0.3,
  executionToVelocity: 0.25
} as const;

const PATH_WEIGHTS = {
  fragility: 0.55,
  executionPenalty: 0.3,
  convexityPenalty: 0.15
} as const;

function computeExecutionVelocity(tasks: Task[]): number {
  if (!tasks.length) return 0;
  const done = tasks.filter((task) => task.status === "DONE").length;
  const inProgress = tasks.filter((task) => task.status === "IN_PROGRESS").length;
  return clampPct(((done + inProgress * 0.5) / tasks.length) * 100);
}

function computeOpenFragilityMass(affairs: Affair[], lineageRisks: LineageRisk[]): number {
  const affairMass = affairs
    .filter((affair) => affair.status !== "DONE")
    .reduce((sum, affair) => sum + Number(affair.fragilityScore ?? 0), 0);
  const lineageMass = lineageRisks
    .filter((risk) => risk.status !== "RESOLVED")
    .reduce((sum, risk) => sum + Number(risk.fragilityScore ?? 0), 0);
  return Number((affairMass + lineageMass).toFixed(2));
}

function topCriticalNode(affairs: Affair[], lineageRisks: LineageRisk[]): string {
  const affairTop = affairs
    .filter((affair) => affair.status !== "DONE")
    .sort((left, right) => Number(right.fragilityScore ?? 0) - Number(left.fragilityScore ?? 0))[0];
  const lineageTop = lineageRisks
    .filter((risk) => risk.status !== "RESOLVED")
    .sort((left, right) => Number(right.fragilityScore ?? 0) - Number(left.fragilityScore ?? 0))[0];

  if (!affairTop && !lineageTop) return "No critical node";
  if (!lineageTop) return affairTop?.title ?? "No critical node";
  if (!affairTop) return lineageTop.title;
  return Number(affairTop.fragilityScore ?? 0) >= Number(lineageTop.fragilityScore ?? 0) ? affairTop.title : lineageTop.title;
}

function computeVirtueSpiral(args: {
  openFragilityMass: number;
  optionalityIndex: number;
  robustnessProgress: number;
  executionVelocity: number;
  affairsCount: number;
  interestsCount: number;
}): LoadedState["dashboard"]["virtueSpiral"] {
  const {
    openFragilityMass,
    optionalityIndex,
    robustnessProgress,
    executionVelocity,
    affairsCount,
    interestsCount
  } = args;

  const fragilityScale = Math.max(1, affairsCount * 100);
  const convexityScale = Math.max(1, interestsCount * 100);
  const fragilityNorm = clampPct(safeRatio(openFragilityMass, fragilityScale) * 100);
  const convexityNorm = clampPct(safeRatio(optionalityIndex, convexityScale) * 100);

  const fragilityTrendDown = fragilityNorm <= 35;
  const convexityTrendUp = convexityNorm >= 45;
  const velocityHealthy = executionVelocity >= 35;

  const trend: "UP" | "STABLE" | "DOWN" =
    fragilityTrendDown && convexityTrendUp && velocityHealthy
      ? "UP"
      : fragilityTrendDown || convexityTrendUp
        ? "STABLE"
        : "DOWN";

  const baseScore = clampPct(
    robustnessProgress * DOCTRINE_WEIGHTS.affairsToRobustness +
      convexityNorm * DOCTRINE_WEIGHTS.interestsToConvexity +
      executionVelocity * DOCTRINE_WEIGHTS.executionToVelocity
  );
  const score = clampPct(baseScore + (trend === "UP" ? 6 : trend === "DOWN" ? -8 : 0));

  const stageOrder = ["REDUCE_FRAGILITY", "SECURE_SURVIVAL", "ASYMMETRIC_BETS", "GAIN_RESOURCES", "DOMINANCE"] as const;
  let stageIndex =
    score >= 80 ? 4 :
    score >= 60 ? 3 :
    score >= 40 ? 2 :
    score >= 20 ? 1 : 0;
  if (trend === "DOWN" && stageIndex > 0) stageIndex -= 1;
  const stage = stageOrder[stageIndex];

  const nextAction =
    openFragilityMass > optionalityIndex
      ? "Queue the highest-fragility affair in Surgical Execution."
      : executionVelocity < 35
        ? "Clear one blocked dependency in Surgical Execution."
        : convexityNorm < 45
          ? "Create one capped-downside interest to increase convexity."
          : "Reinvest gains into mission-critical means.";

  return {
    stage,
    score,
    trend,
    nextAction,
    openFragilityMass: safeNumber(openFragilityMass, 0),
    convexityMass: Number(safeNumber(optionalityIndex, 0).toFixed(2)),
    executionVelocity: clampPct(executionVelocity)
  };
}

function computePathComparator(args: {
  openFragilityMass: number;
  optionalityIndex: number;
  executionVelocity: number;
  affairsCount: number;
  interestsCount: number;
  tasks: Task[];
  criticalNode: string;
}): LoadedState["dashboard"]["pathComparator"] {
  const { openFragilityMass, optionalityIndex, executionVelocity, affairsCount, interestsCount, tasks, criticalNode } = args;
  const fragilityNorm = clampPct(safeRatio(openFragilityMass, Math.max(1, affairsCount * 100)) * 100);
  const convexityNorm = clampPct(safeRatio(optionalityIndex, Math.max(1, interestsCount * 100)) * 100);
  const ruinRisk = clampPct(
    fragilityNorm * PATH_WEIGHTS.fragility +
      (100 - executionVelocity) * PATH_WEIGHTS.executionPenalty +
      (100 - convexityNorm) * PATH_WEIGHTS.convexityPenalty
  );
  const survivalOdds = clampPct(100 - ruinRisk + convexityNorm * 0.2);
  const unpreparedScore = ruinRisk;
  const preparedScore = clampPct((100 - ruinRisk) * 0.5 + convexityNorm * 0.25 + executionVelocity * 0.25);
  const delta = Number((preparedScore - unpreparedScore).toFixed(2));
  const timeToImpact = tasks.some((task) => task.horizon === "WEEK" && task.status !== "DONE") ? 7 : 30;
  const resourceBurn = clampPct(50 + fragilityNorm * 0.4 - executionVelocity * 0.2);
  return {
    unpreparedScore,
    preparedScore,
    delta,
    ruinRisk,
    survivalOdds,
    timeToImpact,
    resourceBurn,
    criticalNode: criticalNode || "No critical node"
  };
}

function computeCopilot(args: {
  doNow: DashboardDoNowItem[];
  virtueSpiral: LoadedState["dashboard"]["virtueSpiral"];
}): LoadedState["dashboard"]["copilot"] {
  const { doNow, virtueSpiral } = args;
  const top = doNow[0];
  if (!top) {
    return {
      promptState: "State is quiet: no urgent items are currently ranked.",
      suggestedAction: "Create one affair tied to your highest-stakes domain.",
      rationale: "If skipped, fragility remains unmeasured and optionality stays latent.",
      ctaPayload: {
        title: "Seed first affair from copilot",
        sourceType: "PLAN",
        sourceId: "mission-global",
        horizon: "WEEK",
        notes: "Copilot generated action from idle state."
      }
    };
  }

  const sourceType = top.refType === "TASK" ? "PLAN" : top.refType;
  const suggestedAction = `Queue "${top.title}" in Surgical Execution now.`;
  const promptState = `State: ${virtueSpiral.stage.toLowerCase().replace(/_/g, " ")} | trend ${virtueSpiral.trend.toLowerCase()} | score ${virtueSpiral.score}.`;
  const rationale = `If skipped, fragility-pressure compounds and execution velocity decays.`;

  return {
    promptState,
    suggestedAction,
    rationale,
    ctaPayload: {
      title: `Execute: ${top.title}`,
      sourceType,
      sourceId: top.refId,
      horizon: "WEEK",
      notes: `Copilot action from do-now rank (${top.why}).`
    }
  };
}

function fallbackCopilot(): LoadedState["dashboard"]["copilot"] {
  return {
    promptState: "State is degraded: copilot payload failed validation.",
    suggestedAction: "Queue one affair from highest-stakes domain.",
    rationale: "If skipped, fragility compounds while execution stalls.",
    ctaPayload: {
      title: "Seed affair from degraded copilot",
      sourceType: "PLAN",
      sourceId: "mission-global",
      horizon: "WEEK",
      notes: "Fallback copilot action from invariant guard."
    }
  };
}

function computeDataQuality(args: {
  affairs: Affair[];
  interests: Interest[];
  tasks: Task[];
  lineageRisks: LineageRisk[];
}): "HIGH" | "MEDIUM" | "LOW" {
  const { affairs, interests, tasks, lineageRisks } = args;
  const presenceScore =
    (affairs.length > 0 ? 1 : 0) +
    (interests.length > 0 ? 1 : 0) +
    (tasks.length > 0 ? 1 : 0) +
    (lineageRisks.length > 0 ? 1 : 0);

  if (presenceScore >= 3) return "HIGH";
  if (presenceScore >= 2) return "MEDIUM";
  return "LOW";
}

function validateCopilotPayload(copilot: LoadedState["dashboard"]["copilot"]): string[] {
  const violations: string[] = [];
  if (!copilot.ctaPayload.title?.trim()) violations.push("copilot.ctaPayload.title is empty.");
  if (!copilot.ctaPayload.sourceType) violations.push("copilot.ctaPayload.sourceType is missing.");
  if (!copilot.ctaPayload.sourceId?.trim()) violations.push("copilot.ctaPayload.sourceId is empty.");
  if (!copilot.ctaPayload.horizon) violations.push("copilot.ctaPayload.horizon is missing.");
  if (!copilot.ctaPayload.notes?.trim()) violations.push("copilot.ctaPayload.notes is empty.");
  return violations;
}

function evaluateDecisionAccelerationInvariants(args: {
  pathComparator: LoadedState["dashboard"]["pathComparator"];
  virtueSpiral: LoadedState["dashboard"]["virtueSpiral"];
  copilot: LoadedState["dashboard"]["copilot"];
}): string[] {
  const { pathComparator, virtueSpiral, copilot } = args;
  const violations: string[] = [];

  const boundedMetrics: Array<[string, number]> = [
    ["pathComparator.ruinRisk", pathComparator.ruinRisk],
    ["pathComparator.survivalOdds", pathComparator.survivalOdds],
    ["pathComparator.resourceBurn", pathComparator.resourceBurn],
    ["virtueSpiral.executionVelocity", virtueSpiral.executionVelocity]
  ];

  for (const [name, value] of boundedMetrics) {
    if (!Number.isFinite(value) || value < 0 || value > 100) {
      violations.push(`${name} is out of [0, 100] bounds.`);
    }
  }

  const expectedDelta = Number((pathComparator.preparedScore - pathComparator.unpreparedScore).toFixed(2));
  if (Math.abs(expectedDelta - pathComparator.delta) > 0.05) {
    violations.push("pathComparator.delta mismatch against prepared-unprepared.");
  }

  if (pathComparator.unpreparedScore >= pathComparator.preparedScore) {
    violations.push("unprepared score is not worse than prepared score.");
  }

  violations.push(...validateCopilotPayload(copilot));
  return violations;
}

function deriveProtocolState(args: {
  ruinRisk: number;
  dataQuality: "HIGH" | "MEDIUM" | "LOW";
  invariantViolations: string[];
}): "NOMINAL" | "WATCH" | "CRITICAL" {
  const { ruinRisk, dataQuality, invariantViolations } = args;
  if (ruinRisk >= 70 || invariantViolations.length > 0) return "CRITICAL";
  if (ruinRisk >= 45 || dataQuality !== "HIGH") return "WATCH";
  return "NOMINAL";
}

function computeTripwire(args: {
  ruinRisk: number;
  protocolState: "NOMINAL" | "WATCH" | "CRITICAL";
  openFragilityMass: number;
  executionVelocity: number;
}): LoadedState["dashboard"]["tripwire"] {
  const { ruinRisk, protocolState, openFragilityMass, executionVelocity } = args;
  if (ruinRisk >= 75 || protocolState === "CRITICAL") {
    return {
      state: "BLOCK",
      reason: "No-ruin gate breached: ruin risk is critical.",
      recoveryAction: "Queue highest-fragility affair and clear one blocked dependency.",
      riskyActionBlocked: true
    };
  }
  if (ruinRisk >= 50 || openFragilityMass > 250 || executionVelocity < 25 || protocolState === "WATCH") {
    return {
      state: "WATCH",
      reason: "Fragility pressure elevated. New risk allocation requires caution.",
      recoveryAction: "Stabilize obligations before adding new speculative exposure.",
      riskyActionBlocked: false
    };
  }
  return {
    state: "NOMINAL",
    reason: "No-ruin guardrails are within tolerance.",
    recoveryAction: "Maintain barbell discipline and monitor leading risks.",
    riskyActionBlocked: false
  };
}

function computeRuinLedger(args: {
  lineageRisks: LineageRisk[];
  affairs: Affair[];
}): LoadedState["dashboard"]["ruinLedger"] {
  const { lineageRisks, affairs } = args;
  return lineageRisks
    .filter((risk) => risk.status !== "RESOLVED")
    .sort((left, right) => Number(right.fragilityScore ?? 0) - Number(left.fragilityScore ?? 0))
    .slice(0, 8)
    .map((risk) => {
      const relatedAffairs = affairs.filter((affair) => affair.domainId === risk.domainId);
      const hedgeStatus: "HEDGED" | "PARTIAL" | "UNHEDGED" =
        relatedAffairs.some((affair) => affair.status === "DONE")
          ? "HEDGED"
          : relatedAffairs.length > 0
            ? "PARTIAL"
            : "UNHEDGED";
      return {
        id: risk.id,
        title: risk.title,
        domainId: risk.domainId,
        sourceId: risk.sourceId,
        irreversibility: clampPct((Number(risk.irreversibility ?? 5) / 10) * 100),
        fragilityScore: clampPct(Number(risk.fragilityScore ?? 0)),
        timeToImpactDays: Math.max(1, Number(risk.responseTime ?? 7)),
        hedgeStatus
      };
    });
}

function computeViolationFeed(args: {
  doctrineRules: DoctrineRule[];
  invariantViolations: string[];
  protocolState: "NOMINAL" | "WATCH" | "CRITICAL";
}): LoadedState["dashboard"]["violationFeed"] {
  const { doctrineRules, invariantViolations, protocolState } = args;
  const nowIso = new Date().toISOString();
  const feed: LoadedState["dashboard"]["violationFeed"] = [];

  for (const rule of doctrineRules.filter((rule) => rule.active && rule.severity === "HARD_GATE").slice(0, 3)) {
    if (protocolState === "CRITICAL") {
      feed.push({
        id: `rule-${rule.id}`,
        severity: "HARD_GATE",
        message: `Hard gate active: ${rule.statement}`,
        source: rule.code,
        detectedAtIso: nowIso
      });
    }
  }

  invariantViolations.slice(0, 5).forEach((violation, index) => {
    feed.push({
      id: `invariant-${index}`,
      severity: "SOFT",
      message: violation,
      source: "invariant-check",
      detectedAtIso: nowIso
    });
  });

  return feed;
}

function computeLatency(tasks: Task[]): LoadedState["dashboard"]["latency"] {
  const active = tasks.filter((task) => task.status !== "DONE");
  const value = active.length ? Math.round((active.length * 3.5)) : 4;
  return {
    signalToQueueMinutes: value,
    signalToQueueBand: value <= 8 ? "FAST" : value <= 20 ? "NORMAL" : "SLOW"
  };
}

function computeCounterfactual(pathComparator: LoadedState["dashboard"]["pathComparator"]): LoadedState["dashboard"]["counterfactual"] {
  const preparedDelta = Number((100 - pathComparator.ruinRisk).toFixed(2));
  const unpreparedDelta = Number((100 - pathComparator.unpreparedScore).toFixed(2));
  const netGain = Number((preparedDelta - unpreparedDelta).toFixed(2));
  return {
    preparedDelta,
    unpreparedDelta,
    netGain,
    note: netGain >= 0 ? "Prepared path improves expected survival." : "Prepared path underperforming baseline."
  };
}

function computeConfidence(args: {
  dataQuality: "HIGH" | "MEDIUM" | "LOW";
  invariantViolations: string[];
  lastLoadedAtIso: string;
}): LoadedState["dashboard"]["confidence"] {
  const recencyMinutes = Math.max(0, Math.round((Date.now() - Date.parse(args.lastLoadedAtIso)) / 60000));
  const evidenceCount = Math.max(1, 4 - args.invariantViolations.length);
  const confidence: "HIGH" | "MEDIUM" | "LOW" =
    args.dataQuality === "HIGH" && args.invariantViolations.length === 0 && recencyMinutes < 15
      ? "HIGH"
      : args.dataQuality === "LOW" || args.invariantViolations.length > 2
        ? "LOW"
        : "MEDIUM";
  return { confidence, evidenceCount, recencyMinutes };
}

function computeOptionalityBudget(optionalityIndex: number): LoadedState["dashboard"]["optionalityBudget"] {
  const redlinePct = 80;
  const usedPct = clampPct((optionalityIndex / Math.max(1, optionalityIndex + 400)) * 100);
  const canAllocate = usedPct < redlinePct;
  return {
    usedPct,
    redlinePct,
    canAllocate,
    rationale: canAllocate ? "Budget has room for capped-downside options." : "Redline reached. Allocate only after hedge reinforcement."
  };
}

function computeFragilityTimeline(args: {
  openFragilityMass: number;
  optionalityIndex: number;
}): LoadedState["dashboard"]["fragilityTimeline"] {
  const now = Date.now();
  return Array.from({ length: 7 }, (_, idx) => {
    const offset = 6 - idx;
    return {
      atIso: new Date(now - offset * 24 * 60 * 60 * 1000).toISOString(),
      fragility: clampPct(args.openFragilityMass * (0.9 + offset * 0.015)),
      convexity: clampPct((args.optionalityIndex / 4) * (0.92 + idx * 0.01))
    };
  });
}

function computeDecisionReplay(args: {
  virtueSpiral: LoadedState["dashboard"]["virtueSpiral"];
  doNow: DashboardDoNowItem[];
  pathComparator: LoadedState["dashboard"]["pathComparator"];
}): LoadedState["dashboard"]["decisionReplay"] {
  const now = Date.now();
  const top = args.doNow[0];
  return [
    {
      id: "replay-state",
      atIso: new Date(now - 12 * 60 * 1000).toISOString(),
      state: `${args.virtueSpiral.stage} / ${args.virtueSpiral.trend}`,
      action: "Assess state and rank do-now actions",
      outcome: `Ruin risk ${args.pathComparator.ruinRisk}%`
    },
    {
      id: "replay-action",
      atIso: new Date(now - 8 * 60 * 1000).toISOString(),
      state: "Top action selected",
      action: top ? `Queue ${top.title}` : "Seed first affair",
      outcome: `Comparator delta ${args.pathComparator.delta}`
    },
    {
      id: "replay-outcome",
      atIso: new Date(now - 3 * 60 * 1000).toISOString(),
      state: "Execution response",
      action: "Monitor no-ruin gate",
      outcome: args.pathComparator.delta >= 0 ? "Prepared path improved." : "Prepared path regressed."
    }
  ];
}

function computeBlastRadius(args: {
  tasks: Task[];
  affairs: Affair[];
  interests: Interest[];
  lineageRisks: LineageRisk[];
}): LoadedState["dashboard"]["blastRadius"] {
  const nodes: LoadedState["dashboard"]["blastRadius"]["nodes"] = [];
  const edges: LoadedState["dashboard"]["blastRadius"]["edges"] = [];

  const taskById = new Map(args.tasks.map((task) => [task.id, task]));
  const criticalTask = args.tasks
    .filter((task) => task.status !== "DONE")
    .sort((a, b) => Number(b.effortEstimate ?? 0) - Number(a.effortEstimate ?? 0))[0];

  args.tasks.slice(0, 14).forEach((task) => {
    nodes.push({
      id: `task-${task.id}`,
      label: task.title,
      kind: "TASK",
      risk: clampPct((task.status === "DONE" ? 0 : 60) + Number(task.effortEstimate ?? 0) * 2)
    });
    for (const depId of task.dependencyIds ?? []) {
      if (!taskById.has(depId)) continue;
      edges.push({
        id: `edge-${depId}-${task.id}`,
        from: `task-${depId}`,
        to: `task-${task.id}`,
        weight: 1
      });
    }
  });

  args.affairs.slice(0, 6).forEach((affair) => {
    nodes.push({
      id: `affair-${affair.id}`,
      label: affair.title,
      kind: "AFFAIR",
      risk: clampPct(Number(affair.fragilityScore ?? 0))
    });
  });

  args.interests.slice(0, 6).forEach((interest) => {
    nodes.push({
      id: `interest-${interest.id}`,
      label: interest.title,
      kind: "INTEREST",
      risk: clampPct(100 - Number(interest.convexity ?? 0) * 10)
    });
  });

  args.lineageRisks.slice(0, 4).forEach((risk) => {
    nodes.push({
      id: `lineage-${risk.id}`,
      label: risk.title,
      kind: "LINEAGE",
      risk: clampPct(Number(risk.fragilityScore ?? 0))
    });
  });

  return {
    nodes,
    edges,
    criticalNodeId: criticalTask ? `task-${criticalTask.id}` : undefined
  };
}

function computeMissionBottlenecks(tasks: Task[], affairs: Affair[]): LoadedState["dashboard"]["missionBottlenecks"] {
  return affairs
    .slice(0, 8)
    .map((affair) => {
      const linkedTasks = tasks.filter((task) => task.sourceType === "AFFAIR" && task.sourceId === affair.id);
      const backlog = linkedTasks.filter((task) => task.status !== "DONE").length;
      const blockingLoad = linkedTasks.reduce((sum, task) => sum + (task.dependencyIds?.length ?? 0), 0);
      const bottleneckScore = round1(clampPct(backlog * 12 + blockingLoad * 6 + Number(affair.fragilityScore ?? 0) * 0.3));
      return {
        id: affair.id,
        title: affair.title,
        domainId: affair.domainId,
        backlog,
        blockingLoad,
        bottleneckScore
      };
    })
    .sort((a, b) => b.bottleneckScore - a.bottleneckScore)
    .slice(0, 6);
}

function computeHedgeCoverage(args: {
  lineageRisks: LineageRisk[];
  affairs: Affair[];
}): LoadedState["dashboard"]["hedgeCoverage"] {
  const coverage: LoadedState["dashboard"]["hedgeCoverage"] = [];
  for (const risk of args.lineageRisks.slice(0, 10)) {
    const domainAffairs = args.affairs.filter((affair) => affair.domainId === risk.domainId).slice(0, 3);
    if (!domainAffairs.length) {
      coverage.push({ riskId: risk.id, affairId: "none", covered: false });
      continue;
    }
    for (const affair of domainAffairs) {
      coverage.push({
        riskId: risk.id,
        affairId: affair.id,
        covered: affair.status === "DONE" || (affair.completionPct ?? 0) >= 60
      });
    }
  }
  return coverage;
}

function computeConvexityPipeline(args: {
  interests: Interest[];
  tasks: Task[];
}): LoadedState["dashboard"]["convexityPipeline"] {
  const interestsCount = args.interests.length;
  const queued = args.tasks.filter((task) => task.sourceType === "INTEREST").length;
  const executing = args.tasks.filter((task) => task.sourceType === "INTEREST" && task.status === "IN_PROGRESS").length;
  const outcomes = args.tasks.filter((task) => task.sourceType === "INTEREST" && task.status === "DONE").length;
  return [
    { id: "IDEAS", label: "Ideas", count: interestsCount + 2 },
    { id: "INTERESTS", label: "Interests", count: interestsCount },
    { id: "QUEUED", label: "Queued", count: queued },
    { id: "EXECUTING", label: "Executing", count: executing },
    { id: "OUTCOMES", label: "Outcomes", count: outcomes }
  ];
}

function computeOutcomeAttribution(pathComparator: LoadedState["dashboard"]["pathComparator"]): LoadedState["dashboard"]["outcomeAttribution"] {
  const skillPct = clampPct(45 + pathComparator.delta * 0.3);
  const regimePct = clampPct(pathComparator.ruinRisk * 0.35);
  const luckPct = clampPct(100 - skillPct - regimePct);
  return {
    skillPct: round1(skillPct),
    luckPct: round1(luckPct),
    regimePct: round1(regimePct)
  };
}

function computeAssumptions(args: {
  openFragilityMass: number;
  optionalityIndex: number;
  executionVelocity: number;
}): LoadedState["dashboard"]["assumptions"] {
  return [
    {
      id: "assume-fragility-trend",
      statement: "Open fragility mass will not spike in next cycle.",
      stale: args.openFragilityMass > 220
    },
    {
      id: "assume-optionality",
      statement: "Optionality pipeline remains sufficiently populated.",
      stale: args.optionalityIndex < 120
    },
    {
      id: "assume-velocity",
      statement: "Execution velocity will stay above operational threshold.",
      stale: args.executionVelocity < 35
    }
  ];
}

function computeRecoveryPlaybooks(tripwire: LoadedState["dashboard"]["tripwire"]): LoadedState["dashboard"]["recoveryPlaybooks"] {
  return [
    {
      id: "playbook-no-ruin",
      trigger: tripwire.state,
      firstAction: tripwire.recoveryAction,
      owner: "Mission Command"
    },
    {
      id: "playbook-velocity",
      trigger: "SLOW_EXECUTION",
      firstAction: "Clear highest-blocking dependency and re-queue critical affair.",
      owner: "Surgical Execution"
    }
  ];
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
    notes: row.notes ? String(row.notes) : undefined,
    labStage: row.lab_stage ? String(row.lab_stage).toUpperCase() as Interest["labStage"] : "FORGE",
    hypothesis: row.hypothesis ? String(row.hypothesis) : undefined,
    maxLossPct: row.max_loss_pct != null ? Number(row.max_loss_pct) : undefined,
    expiryDate: row.expiry_date ? String(row.expiry_date) : undefined,
    killCriteria: parseJsonOrDefault<string[]>(row.kill_criteria_json, []),
    hedgePct: row.hedge_pct != null ? Number(row.hedge_pct) : undefined,
    edgePct: row.edge_pct != null ? Number(row.edge_pct) : undefined,
    irreversibility: row.irreversibility != null ? Number(row.irreversibility) : undefined,
    evidenceNote: row.evidence_note ? String(row.evidence_note) : undefined
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
    const optionalityIndex = computeOptionality(interests);
    const robustnessProgress = computeRobustnessProgress(affairs);
    const executionVelocity = computeExecutionVelocity(tasks);
    const openFragilityMass = computeOpenFragilityMass(affairs, lineageRisks);
    const criticalNode = topCriticalNode(affairs, lineageRisks);
    const virtueSpiral = computeVirtueSpiral({
      openFragilityMass,
      optionalityIndex,
      robustnessProgress,
      executionVelocity,
      affairsCount: affairs.length,
      interestsCount: interests.length
    });
    const pathComparator = computePathComparator({
      openFragilityMass,
      optionalityIndex,
      executionVelocity,
      affairsCount: affairs.length,
      interestsCount: interests.length,
      tasks,
      criticalNode
    });
    let copilot = computeCopilot({ doNow, virtueSpiral });
    let invariantViolations = evaluateDecisionAccelerationInvariants({
      pathComparator,
      virtueSpiral,
      copilot
    });
    let fallbackUsed = false;
    if (invariantViolations.some((issue) => issue.startsWith("copilot."))) {
      copilot = fallbackCopilot();
      fallbackUsed = true;
      invariantViolations = evaluateDecisionAccelerationInvariants({
        pathComparator,
        virtueSpiral,
        copilot
      });
    }
    const dataQuality = computeDataQuality({ affairs, interests, tasks, lineageRisks });
    const decisionAccelerationMeta: LoadedState["dashboard"]["decisionAccelerationMeta"] = {
      computedAtIso: new Date().toISOString(),
      dataQuality,
      invariantViolations,
      fallbackUsed,
      protocolState: deriveProtocolState({
        ruinRisk: pathComparator.ruinRisk,
        dataQuality,
        invariantViolations
      })
    };
    const tripwire = computeTripwire({
      ruinRisk: pathComparator.ruinRisk,
      protocolState: decisionAccelerationMeta.protocolState,
      openFragilityMass,
      executionVelocity
    });
    const ruinLedger = computeRuinLedger({ lineageRisks, affairs });
    const violationFeed = computeViolationFeed({
      doctrineRules: doctrine.rules,
      invariantViolations,
      protocolState: decisionAccelerationMeta.protocolState
    });
    const latency = computeLatency(tasks);
    const counterfactual = computeCounterfactual(pathComparator);
    const confidence = computeConfidence({
      dataQuality,
      invariantViolations,
      lastLoadedAtIso: new Date().toISOString()
    });
    const optionalityBudget = computeOptionalityBudget(optionalityIndex);
    const fragilityTimeline = computeFragilityTimeline({ openFragilityMass, optionalityIndex });
    const decisionReplay = computeDecisionReplay({ virtueSpiral, doNow, pathComparator });
    const blastRadius = computeBlastRadius({ tasks, affairs, interests, lineageRisks });
    const missionBottlenecks = computeMissionBottlenecks(tasks, affairs);
    const hedgeCoverage = computeHedgeCoverage({ lineageRisks, affairs });
    const convexityPipeline = computeConvexityPipeline({ interests, tasks });
    const outcomeAttribution = computeOutcomeAttribution(pathComparator);
    const assumptions = computeAssumptions({ openFragilityMass, optionalityIndex, executionVelocity });
    const recoveryPlaybooks = computeRecoveryPlaybooks(tripwire);
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
        optionalityIndex,
        robustnessProgress,
        virtueSpiral,
        pathComparator,
        copilot,
        decisionAccelerationMeta,
        tripwire,
        ruinLedger,
        violationFeed,
        latency,
        counterfactual,
        confidence,
        optionalityBudget,
        fragilityTimeline,
        decisionReplay,
        blastRadius,
        missionBottlenecks,
        hedgeCoverage,
        convexityPipeline,
        outcomeAttribution,
        assumptions,
        recoveryPlaybooks
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
export { detectConflict, refreshIfStale, normalize } from "./storage";
export { writeAffair, writeInterest, writeTask } from "./commands";
