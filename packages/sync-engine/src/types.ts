import type { DashboardDoNowItem, KhalState } from "@khal/domain";

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
