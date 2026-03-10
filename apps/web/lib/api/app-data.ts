import type { LoadedState } from "@khal/sync-engine";

export function toMonolithAppData(payload: LoadedState) {
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
    const volatilitySourceName = domain.volatilitySourceName ?? row?.heading ?? "Unknown Volatility";
    return {
      id: domain.id,
      name: domain.name,
      lawId: domain.lawId ?? domain.volatilitySourceId ?? domain.id,
      volatilitySourceId: domain.volatilitySourceId ?? null,
      volatilitySourceName,
      volatility: domain.volatility ?? volatilitySourceName,
      volatilitySource: domain.volatilitySource ?? volatilitySourceName,
      stakesText: domain.stakesText ?? row?.kv?.stakes ?? "Undefined",
      risksText: domain.risksText ?? row?.kv?.risks ?? "Undefined",
      fragilityText: domain.fragilityText ?? row?.kv?.fragility ?? "Undefined",
      vulnerabilitiesText: domain.vulnerabilitiesText ?? row?.kv?.vulnerabilities ?? "Undefined",
      hedge: domain.hedge ?? row?.bullets?.[0] ?? "Define hedge",
      edge: domain.edge ?? row?.bullets?.[1] ?? "Define edge",
      heuristics: domain.heuristics ?? row?.bullets?.[2] ?? "Define heuristics",
      tactics: domain.tactics ?? row?.bullets?.[3] ?? "Define tactics",
      interestsText: domain.interestsText ?? row?.bullets?.[4] ?? "",
      affairsText: domain.affairsText ?? row?.bullets?.[5] ?? ""
    };
  });

  const laws = (state.laws ?? []).map((law: any) => ({
    id: law.id,
    name: law.name,
    description: law.description ?? "",
    volatilitySource: law.volatilitySource ?? "",
    associatedCrafts: law.associatedCrafts ?? []
  }));

  const interests = (state.interests ?? []).map((interest: any) => ({
    ...interest,
    labStage: interest.labStage ?? "FORGE",
    perspective: interest.perspective ?? "macro",
    objectives: Array.isArray(interest.objectives) ? interest.objectives : []
  }));

  const affairs = (state.affairs ?? []).map((affair: any) => ({
    ...affair,
    perspective: affair.perspective ?? "macro",
    status: String(affair.status ?? "planning").toLowerCase(),
    context: affair.context ?? { associatedDomains: [affair.domainId].filter(Boolean), volatilityExposure: affair.description ?? "Operational volatility" },
    means: affair.means ?? { craftId: "", selectedHeuristicIds: [] },
    plan: affair.plan ?? { objectives: [], uncertainty: "Unknown", timeHorizon: "Unknown" },
    strategy: affair.strategy ?? { posture: "defense", positioning: "conventional", mapping: { allies: [], enemies: [] } },
    entities: affair.entities ?? []
  }));

  const tasks = (state.tasks ?? []).map((task: any) => ({
    sourceType: task.sourceType ?? "PLAN",
    sourceId: task.sourceId ?? "",
    parentTaskId: task.parentTaskId ?? undefined,
    dependencyIds: Array.isArray(task.dependencyIds) ? task.dependencyIds : [],
    horizon: task.horizon ?? "WEEK",
    dueDate: task.dueDate ?? undefined,
    notes: task.notes ?? undefined,
    id: task.id,
    title: task.title,
    domainId:
      task.sourceType === "AFFAIR"
        ? affairs.find((affair: any) => affair.id === task.sourceId)?.domainId ?? "general"
        : task.sourceType === "INTEREST"
          ? interests.find((interest: any) => interest.id === task.sourceId)?.domainId ?? "general"
          : "general",
    type: String(task.sourceType ?? "").toLowerCase(),
    priority: typeof task.effortEstimate === "number" ? Math.min(100, Math.max(1, Math.round(task.effortEstimate))) : 50,
    progress: task.status === "DONE" ? 100 : task.status === "IN_PROGRESS" ? 50 : 0,
    status: task.status === "DONE" ? "done" : task.status === "IN_PROGRESS" ? "in_progress" : "not_started",
    convexity: 0
  }));

  return {
    user,
    strategyMatrix,
    laws,
    domains,
    interests,
    affairs,
    crafts: state.crafts ?? [],
    tasks,
    sources: (state.sources ?? []).map((source: any) => ({
      id: source.id,
      code: source.code,
      name: source.name,
      sortOrder: source.sortOrder ?? 0,
      domainCount: Array.isArray(source.domains) ? source.domains.length : 0,
      domains: (source.domains ?? []).map((link: any) => ({
        id: link.id,
        sourceId: link.sourceId,
        domainId: link.domainId,
        dependencyKind: link.dependencyKind,
        pathWeight: link.pathWeight ?? 1
      }))
    })),
    missionGraph: state.missionGraph ?? { nodes: [], dependencies: [] },
    lineages: state.lineages ?? { nodes: [], entities: [] },
    lineageRisks: state.lineageRisks ?? [],
    doctrine: state.doctrine ?? { rulebooks: [], rules: [], domainPnLLadders: [] },
    decisionAcceleration: {
      virtueSpiral: payload.dashboard.virtueSpiral,
      pathComparator: payload.dashboard.pathComparator,
      copilot: payload.dashboard.copilot
    },
    decisionAccelerationMeta: payload.dashboard.decisionAccelerationMeta,
    tripwire: payload.dashboard.tripwire,
    ruinLedger: payload.dashboard.ruinLedger,
    violationFeed: payload.dashboard.violationFeed,
    latency: payload.dashboard.latency,
    counterfactual: payload.dashboard.counterfactual,
    confidence: payload.dashboard.confidence,
    optionalityBudget: payload.dashboard.optionalityBudget,
    fragilityTimeline: payload.dashboard.fragilityTimeline,
    decisionReplay: payload.dashboard.decisionReplay,
    blastRadius: payload.dashboard.blastRadius,
    missionBottlenecks: payload.dashboard.missionBottlenecks,
    hedgeCoverage: payload.dashboard.hedgeCoverage,
    convexityPipeline: payload.dashboard.convexityPipeline,
    outcomeAttribution: payload.dashboard.outcomeAttribution,
    assumptions: payload.dashboard.assumptions,
    recoveryPlaybooks: payload.dashboard.recoveryPlaybooks
  };
}
