import type { Affair, Craft, Interest, KhalState, Task } from "@khal/domain";
import type { SourceMapProfileDto } from "../../components/war-room-v2/types";
import type { WarGameDoctrineChain } from "../war-room/bootstrap";
import {
  doctrineQuickActionSchema,
  decisionEvaluationResultSchema,
  decisionSpecSchema,
  triageEvaluationSnapshotSchema,
  triageSuggestionSchema,
  type DecisionBlockReasonDto,
  type DecisionEvaluationResultDto,
  type DecisionSpecDto,
  type DoctrineQuickActionDto,
  type DoctrineQuickActionKindDto,
  type TriageEvaluationSnapshotDto,
  type TriageSuggestionDto,
  type WarGameModeSpec
} from "./schema";

const PIPELINE_STAGES = [
  "Context Load",
  "Grammar Completion",
  "Dependency Check",
  "Risk/Fragility Computation",
  "Ends/Means Fit",
  "Doctrine Guard Evaluation",
  "Execution Eligibility",
  "Action Plan Emit"
];

const SPEC: DecisionSpecDto = decisionSpecSchema.parse({
  version: "v0.4.3",
  pipelineStages: PIPELINE_STAGES,
  guards: [
    { id: "G1_COMPLEX_MONOMODAL", title: "Complex Domain Requires Bimodal Ends", description: "Block monomodal ends in complex domains unless overridden.", hard: true },
    { id: "G2_AFFAIRS_ROBUSTNESS", title: "Affairs Must Bias Robustness", description: "Affairs must show downside cap posture.", hard: true },
    { id: "G3_INTEREST_CONVEXITY", title: "Interests Must Bias Convexity", description: "Interests need upside + max-loss declaration.", hard: true },
    { id: "G4_NO_RUIN", title: "No-Ruin Gate", description: "Execution blocked when no-ruin gates fail.", hard: true },
    { id: "G5_EXACT_MISSING", title: "Exact Missing Items", description: "Block responses must include exact missing items.", hard: true }
  ],
  modes: [
    { mode: "source", title: "Source", narrative: "Map semantic domains, decision structure, tail behavior, quadrant, Stone posture, ends, and admissible means.", requiredFields: ["source_profile", "semantic_domains", "decision_type", "tail_class", "quadrant", "means_posture", "stakes", "risks", "fragility_profile", "ends", "means"], predecessors: [] },
    { mode: "domain", title: "Domain", narrative: "War-game domain posture and fragility logic.", requiredFields: ["domain_class", "stakes", "risk_map", "fragility_profile", "ends_means_posture"], predecessors: ["source"] },
    { mode: "affair", title: "Affair", narrative: "War-game obligations and deterministic prep.", requiredFields: ["objective", "orks_kpis", "preparation", "thresholds", "execution_chain"], predecessors: ["domain"] },
    { mode: "interest", title: "Interest", narrative: "War-game options via Forge/Wield/Tinker.", requiredFields: ["forge_wield_tinker", "hypothesis", "loss_expiry", "kill_criteria", "barbell_split", "evidence"], predecessors: ["domain"] },
    { mode: "craft", title: "Craft", narrative: "War-game heaps to heuristics pipeline.", requiredFields: ["heap_set", "model_extraction", "framework_assembly", "barbell_output", "heuristic_output"], predecessors: ["interest"] },
    { mode: "lineage", title: "Lineage", narrative: "War-game exposure scaling and blast radius.", requiredFields: ["exposure_map", "stake_scaling", "blast_radius", "intergenerational_risk"], predecessors: ["source", "domain"] },
    { mode: "mission", title: "Mission", narrative: "War-game hierarchy and no-ruin mission synthesis.", requiredFields: ["hierarchy", "dependency_chain", "readiness", "no_ruin_constraints"], predecessors: ["affair", "interest", "lineage"] }
  ]
});

function isComplexDomain(domain: KhalState["domains"][number] | undefined): boolean {
  if (!domain) return false;
  const hay = `${domain.description ?? ""} ${domain.stateOfTheArtNotes ?? ""}`.toLowerCase();
  return hay.includes("complex") || hay.includes("thick") || hay.includes("nonlinear") || hay.includes("volatility");
}

function hasDomainBarbellPosture(state: KhalState, domainId: string): { hedge: boolean; edge: boolean } {
  const relatedEnds = state.ends.filter((end) => end.domainId === domainId);
  const relatedInterests = state.interests.filter((interest) => interest.domainId === domainId);
  const endText = relatedEnds
    .map((end) => `${end.title ?? ""} ${end.description ?? ""}`)
    .join(" ")
    .toLowerCase();
  const hedge = /\bhedge\b/.test(endText) || relatedInterests.some((interest) => (interest.hedgePct ?? 0) > 0);
  const edge = /\bedge\b/.test(endText) || relatedInterests.some((interest) => (interest.edgePct ?? 0) > 0);
  return { hedge, edge };
}

function missingDoctrineForSourceMode(profiles: SourceMapProfileDto[], responseLogic: WarGameDoctrineChain[]): string[] {
  if (!profiles.length) return [];
  const selectedCraftIds = Array.from(
    new Set(
      profiles
        .map((item) => item.primaryCraftId?.trim())
        .filter((item): item is string => Boolean(item))
    )
  );
  if (!selectedCraftIds.length) return [];

  const doctrineChains = responseLogic.filter((chain) => selectedCraftIds.includes(chain.craftId));
  if (!doctrineChains.length) return ["doctrine_chain"];

  const hasScenarios = doctrineChains.some((chain) => chain.scenarios.length > 0);
  if (!hasScenarios) return ["scenario_logic"];

  const hasThreats = doctrineChains.some((chain) => chain.scenarios.some((scenario) => scenario.threats.length > 0));
  if (!hasThreats) return ["threat_logic"];

  const hasResponses = doctrineChains.some((chain) => chain.scenarios.some((scenario) => scenario.threats.some((threat) => threat.responses.length > 0)));
  if (!hasResponses) return ["response_logic"];

  return [];
}

function missingForMode(
  mode: WarGameModeSpec,
  state: KhalState,
  targetId: string,
  sourceMapProfiles: SourceMapProfileDto[] = [],
  responseLogic: WarGameDoctrineChain[] = []
): string[] {
  if (mode === "source") {
    const source = (state.sources ?? []).find((item) => item.id === targetId);
    const requiredDomainIds = Array.from(new Set((source?.domains ?? []).map((item) => item.domainId)));
    const relevantProfiles = sourceMapProfiles.filter((item) => item.sourceId === targetId && (requiredDomainIds.length === 0 || requiredDomainIds.includes(item.domainId)));
    const profileByDomainId = new Map(relevantProfiles.map((item) => [item.domainId, item]));
    const completeCoverage = requiredDomainIds.length > 0 && requiredDomainIds.every((domainId) => profileByDomainId.has(domainId));
    const allMappedProfiles = completeCoverage ? requiredDomainIds.map((domainId) => profileByDomainId.get(domainId)).filter(Boolean) as SourceMapProfileDto[] : [];
    const grammarMissing = [
      source?.name ? null : "source_profile",
      (source?.domains?.length ?? 0) > 0 ? null : "semantic_domains",
      completeCoverage && allMappedProfiles.every((item) => Boolean(item.decisionType)) ? null : "decision_type",
      completeCoverage && allMappedProfiles.every((item) => Boolean(item.tailClass)) ? null : "tail_class",
      completeCoverage && allMappedProfiles.every((item) => Boolean(item.quadrant)) ? null : "quadrant",
      completeCoverage && allMappedProfiles.every((item) => Boolean(item.methodPosture)) ? null : "means_posture",
      completeCoverage && allMappedProfiles.every((item) => Boolean(item.stakesText?.trim())) ? null : "stakes",
      completeCoverage && allMappedProfiles.every((item) => Boolean(item.risksText?.trim())) ? null : "risks",
      completeCoverage && allMappedProfiles.every((item) => Boolean(item.fragilityPosture?.trim()) && Boolean(item.vulnerabilitiesText?.trim())) ? null : "fragility_profile",
      completeCoverage && allMappedProfiles.every((item) => Boolean(item.hedgeText?.trim()) && Boolean(item.edgeText?.trim())) ? null : "ends",
      completeCoverage && allMappedProfiles.every((item) => Boolean(item.primaryCraftId?.trim()) && Boolean(item.heuristicsText?.trim()) && Boolean(item.avoidText?.trim())) ? null : "means"
    ].filter(Boolean) as string[];
    if (grammarMissing.length) return grammarMissing;
    return missingDoctrineForSourceMode(allMappedProfiles, responseLogic);
  }
  if (mode === "domain") {
    const domain = state.domains.find((item) => item.id === targetId);
    const fragilitys = state.fragilities.filter((item) => item.domainId === targetId);
    const domainEnds = state.ends.filter((item) => item.domainId === targetId);
    const { hedge, edge } = hasDomainBarbellPosture(state, targetId);
    return [
      domain ? null : "domain_class",
      fragilitys.length > 0 || state.affairs.some((item) => item.domainId === targetId) ? null : "stakes",
      fragilitys.some((item) => item.risk > 0) ? null : "risk_map",
      fragilitys.length > 0 ? null : "fragility_profile",
      domainEnds.length > 0 && hedge && edge ? null : "ends_means_posture"
    ].filter(Boolean) as string[];
  }
  if (mode === "affair") {
    const affair = state.affairs.find((item) => item.id === targetId);
    return [
      affair?.title ? null : "objective",
      typeof affair?.stakes === "number" && typeof affair?.risk === "number" ? null : "orks_kpis",
      affair?.means?.craftId ? null : "preparation",
      affair?.timeline ? null : "thresholds",
      state.tasks.some((task) => task.sourceType === "AFFAIR" && task.sourceId === targetId) ? null : "execution_chain"
    ].filter(Boolean) as string[];
  }
  if (mode === "interest") {
    const interest = state.interests.find((item) => item.id === targetId);
    const linkedTasks = state.tasks.filter((task) => task.sourceType === "INTEREST" && task.sourceId === targetId);
    return [
      interest?.labStage ? null : "forge_wield_tinker",
      interest?.hypothesis ? null : "hypothesis",
      interest?.maxLossPct && interest?.expiryDate ? null : "loss_expiry",
      (interest?.killCriteria?.length ?? 0) > 0 ? null : "kill_criteria",
      typeof interest?.hedgePct === "number" && typeof interest?.edgePct === "number" ? null : "barbell_split",
      linkedTasks.some((task) => task.status !== "NOT_STARTED") || interest?.evidenceNote ? null : "evidence"
    ].filter(Boolean) as string[];
  }
  if (mode === "craft") {
    const craft = state.crafts.find((item) => item.id === targetId);
    return [
      (craft?.heaps?.length ?? 0) > 0 ? null : "heap_set",
      (craft?.models?.length ?? 0) > 0 ? null : "model_extraction",
      (craft?.frameworks?.length ?? 0) > 0 ? null : "framework_assembly",
      (craft?.barbellStrategies?.length ?? 0) > 0 ? null : "barbell_output",
      (craft?.heuristics?.length ?? 0) > 0 ? null : "heuristic_output"
    ].filter(Boolean) as string[];
  }
  if (mode === "lineage") {
    const risks = (state.lineageRisks ?? []).filter((item) => item.lineageNodeId === targetId || targetId === "global");
    return [
      risks.length > 0 ? null : "exposure_map",
      risks.some((risk) => Number(risk.exposure ?? 0) > 0) ? null : "stake_scaling",
      risks.some((risk) => Number(risk.dependency ?? 0) > 0) ? null : "blast_radius",
      risks.some((risk) => Number(risk.irreversibility ?? 0) > 0) ? null : "intergenerational_risk"
    ].filter(Boolean) as string[];
  }
  const nodes = state.missionGraph?.nodes ?? [];
  const deps = state.missionGraph?.dependencies ?? [];
  return [
    nodes.length > 0 ? null : "hierarchy",
    deps.length > 0 ? null : "dependency_chain",
    nodes.length > 0 ? null : "readiness",
    null
  ].filter(Boolean) as string[];
}

function completedModes(state: KhalState): Record<WarGameModeSpec, boolean> {
  const anySource = (state.sources ?? []).length > 0;
  const anyDomain = state.domains.length > 0;
  const anyAffair = state.affairs.length > 0;
  const anyInterest = state.interests.some((i) => Boolean(i.maxLossPct && i.hedgePct && i.edgePct));
  const anyCraft = state.crafts.some((c) => c.heaps.length > 0 && c.models.length > 0 && c.frameworks.length > 0 && c.barbellStrategies.length > 0 && c.heuristics.length > 0);
  const anyLineage = (state.lineageRisks ?? []).length > 0;
  const anyMission = (state.missionGraph?.nodes?.length ?? 0) > 0;
  return {
    source: anySource,
    domain: anyDomain,
    affair: anyAffair,
    interest: anyInterest,
    craft: anyCraft,
    lineage: anyLineage,
    mission: anyMission
  };
}

function evaluateGuards(args: {
  mode: WarGameModeSpec;
  targetId: string;
  state: KhalState;
  noRuinGate: boolean;
  overrides: string[];
}): DecisionBlockReasonDto[] {
  const reasons: DecisionBlockReasonDto[] = [];
  const hasOverride = (guardId: string) => args.overrides.includes(guardId);

  if (args.mode === "domain") {
    const domain = args.state.domains.find((item) => item.id === args.targetId);
    const { hedge, edge } = hasDomainBarbellPosture(args.state, args.targetId);
    if (isComplexDomain(domain) && (!hedge || !edge) && !hasOverride("G1_COMPLEX_MONOMODAL")) {
      reasons.push({
        code: "COMPLEX_MONOMODAL_BLOCK",
        guardId: "G1_COMPLEX_MONOMODAL",
        message: "Complex domain requires bimodal barbell ends (hedge + edge).",
        missingItems: [!hedge ? "hedge" : null, !edge ? "edge" : null].filter(Boolean) as string[],
        overridable: true
      });
    }
  }

  if (args.mode === "affair") {
    const affair = args.state.affairs.find((item) => item.id === args.targetId);
    const posture = affair?.strategy?.posture?.toLowerCase() ?? "";
    const domainPosture = hasDomainBarbellPosture(args.state, affair?.domainId ?? "");
    const hasRobustnessSignal = posture.includes("robust") || posture.includes("hedge") || domainPosture.hedge;
    if (!hasRobustnessSignal && !hasOverride("G2_AFFAIRS_ROBUSTNESS")) {
      reasons.push({
        code: "AFFAIR_NO_HEDGE",
        guardId: "G2_AFFAIRS_ROBUSTNESS",
        message: "Affairs must bias robustness with downside cap posture.",
        missingItems: ["affair.strategy.posture or domain hedge signal"],
        overridable: true
      });
    }
  }

  if (args.mode === "interest") {
    const interest = args.state.interests.find((item) => item.id === args.targetId);
    const missing = [
      typeof interest?.maxLossPct === "number" ? null : "maxLossPct",
      typeof interest?.hedgePct === "number" ? null : "hedgePct",
      typeof interest?.edgePct === "number" ? null : "edgePct"
    ].filter(Boolean) as string[];
    if (missing.length && !hasOverride("G3_INTEREST_CONVEXITY")) {
      reasons.push({
        code: "INTEREST_CONVEXITY_INCOMPLETE",
        guardId: "G3_INTEREST_CONVEXITY",
        message: "Interests require convex setup: upside path with declared max-loss.",
        missingItems: missing,
        overridable: true
      });
    }
  }

  if (!args.noRuinGate) {
    reasons.push({
      code: "NO_RUIN_GATE_FAILED",
      guardId: "G4_NO_RUIN",
      message: "No-ruin gate failed. Execution is blocked.",
      missingItems: ["noRuinGate=true"],
      overridable: false
    });
  }

  return reasons;
}

export function getDecisionSpec(): DecisionSpecDto {
  return SPEC;
}

export function evaluateDecision(args: {
  mode: WarGameModeSpec;
  targetId: string;
  state: KhalState;
  sourceMapProfiles?: SourceMapProfileDto[];
  responseLogic?: WarGameDoctrineChain[];
  role?: "MISSIONARY" | "VISIONARY";
  noRuinGate?: boolean;
  overrides?: string[];
}): DecisionEvaluationResultDto {
  const modeSpec = SPEC.modes.find((item) => item.mode === args.mode);
  if (!modeSpec) {
    return decisionEvaluationResultSchema.parse({
      mode: args.mode,
      targetId: args.targetId,
      blocked: true,
      readinessScore: 0,
      missingRequiredFields: [],
      blockReasons: [{ code: "MODE_NOT_FOUND", message: "Mode spec not found.", missingItems: [], overridable: false }],
      stages: PIPELINE_STAGES.map((id, index) => ({ id, passed: index === 0, message: index === 0 ? "Context loaded." : "Blocked: mode spec missing.", missingItems: [] })),
      nextStage: "Context Load"
    });
  }

  const missingRequiredFields = missingForMode(args.mode, args.state, args.targetId, args.sourceMapProfiles, args.responseLogic);
  const completed = completedModes(args.state);
  const missingPredecessors = modeSpec.predecessors.filter((mode) => !completed[mode]);
  const guardReasons = evaluateGuards({
    mode: args.mode,
    targetId: args.targetId,
    state: args.state,
    noRuinGate: args.noRuinGate ?? true,
    overrides: args.overrides ?? []
  });
  const role = args.role ?? "MISSIONARY";
  const dependencyBlocked = role === "MISSIONARY" && missingPredecessors.length > 0;
  const reasons: DecisionBlockReasonDto[] = [
    ...(missingPredecessors.length
      ? [{
          code: "PREDECESSOR_MISSING",
          message: `Missing predecessor modes: ${missingPredecessors.join(", ")}`,
          missingItems: missingPredecessors,
          overridable: false
        }]
      : []),
    ...(missingRequiredFields.length
      ? [{
          code: "GRAMMAR_INCOMPLETE",
          message: "Required grammar fields are missing.",
          missingItems: missingRequiredFields,
          overridable: false
        }]
      : []),
    ...guardReasons
  ];
  const blocked = dependencyBlocked || missingRequiredFields.length > 0 || guardReasons.length > 0;
  const readinessScore = Math.max(0, Math.min(100, 100 - missingRequiredFields.length * 10 - missingPredecessors.length * 8 - guardReasons.length * 12));

  const stages = PIPELINE_STAGES.map((stage, index) => {
    const passed =
      index === 0 ? true :
      index === 1 ? missingRequiredFields.length === 0 :
      index === 2 ? missingPredecessors.length === 0 || role === "VISIONARY" :
      index === 5 ? guardReasons.length === 0 :
      index < 5 ? missingRequiredFields.length === 0 :
      !blocked;
    const missingItems =
      stage === "Grammar Completion" ? missingRequiredFields :
      stage === "Dependency Check" ? missingPredecessors :
      stage === "Doctrine Guard Evaluation" ? guardReasons.flatMap((reason) => reason.missingItems) :
      [];
    return {
      id: stage,
      passed,
      message: passed ? "Passed" : "Blocked",
      missingItems
    };
  });
  const firstBlockedStage = stages.find((stage) => !stage.passed)?.id;

  return decisionEvaluationResultSchema.parse({
    mode: args.mode,
    targetId: args.targetId,
    blocked,
    readinessScore,
    missingRequiredFields,
    blockReasons: reasons,
    stages,
    nextStage: firstBlockedStage
  });
}

function triageActionsForReason(args: {
  mode: WarGameModeSpec;
  targetId: string;
  reason: DecisionBlockReasonDto;
}): DoctrineQuickActionDto[] {
  const base = {
    mode: args.mode,
    targetId: args.targetId
  };
  const action = (kind: DoctrineQuickActionKindDto, label: string, payload: Record<string, unknown>, guardIds: string[] = []) =>
    doctrineQuickActionSchema.parse({
      id: `${kind}-${args.mode}-${args.targetId}`,
      label,
      kind,
      targetRef: base,
      payload,
      guardIds
    });

  if (args.reason.code === "INTEREST_CONVEXITY_INCOMPLETE" || args.reason.code === "GRAMMAR_INCOMPLETE") {
    const has = (key: string) => args.reason.missingItems.includes(key);
    const out: DoctrineQuickActionDto[] = [];
    if (has("maxLossPct") || has("loss_expiry")) out.push(action("SET_INTEREST_MAX_LOSS_DEFAULT", "Set max-loss default (10%)", { maxLossPct: 10 }, ["G3_INTEREST_CONVEXITY"]));
    if (has("expiryDate") || has("loss_expiry")) out.push(action("SET_INTEREST_EXPIRY_DEFAULT_30D", "Set expiry to +30 days", { expiryOffsetDays: 30 }, ["G3_INTEREST_CONVEXITY"]));
    if (has("killCriteria") || has("kill_criteria")) out.push(action("ADD_INTEREST_KILL_CRITERIA_TEMPLATE", "Add kill-criteria template", { killCriteria: ["No measurable edge by expiry review."] }, ["G3_INTEREST_CONVEXITY"]));
    if (has("barbell_split") || has("hedgePct") || has("edgePct")) out.push(action("SET_INTEREST_BARBELL_90_10", "Set barbell split 90/10", { hedgePct: 90, edgePct: 10 }, ["G3_INTEREST_CONVEXITY"]));
    return out;
  }

  if (args.reason.code === "AFFAIR_NO_HEDGE") {
    return [
      action("SET_AFFAIR_THRESHOLD_TEMPLATE", "Set affair threshold template", { objectives: ["Define no-ruin threshold"], uncertainty: "Known constraints", timeHorizon: "WEEK" }, ["G2_AFFAIRS_ROBUSTNESS"]),
      action("SET_AFFAIR_PREP_TEMPLATE", "Set affair prep template", { methodology: "Checklist first", technology: "Minimal moving parts", techniques: "Fail-safe rehearsal" }, ["G2_AFFAIRS_ROBUSTNESS"])
    ];
  }

  if (args.reason.code === "COMPLEX_MONOMODAL_BLOCK") {
    return [
      action(
        "SET_DOMAIN_BIMODAL_POSTURE_TEMPLATE",
        "Set domain hedge+edge posture template",
        { hedgeText: "Protect downside via robust baseline.", edgeText: "Expose to asymmetric upside via capped bets." },
        ["G1_COMPLEX_MONOMODAL"]
      )
    ];
  }

  if (args.reason.code === "NO_RUIN_GATE_FAILED") {
    return [action("TRIPWIRE_RECOVERY_PATH", "Open no-ruin recovery path", { guidance: "Resolve tripwire recovery action before execution." }, ["G4_NO_RUIN"])];
  }

  return [];
}

function reasonPriority(reason: DecisionBlockReasonDto): number {
  if (reason.code === "NO_RUIN_GATE_FAILED") return 100;
  if (reason.code === "COMPLEX_MONOMODAL_BLOCK") return 90;
  if (reason.code === "AFFAIR_NO_HEDGE") return 85;
  if (reason.code === "INTEREST_CONVEXITY_INCOMPLETE") return 80;
  if (reason.code === "GRAMMAR_INCOMPLETE") return 75;
  if (reason.code === "PREDECESSOR_MISSING") return 60;
  return 50;
}

export function buildDeterministicTriage(args: {
  mode: WarGameModeSpec;
  targetId: string;
  state: KhalState;
  sourceMapProfiles?: SourceMapProfileDto[];
  responseLogic?: WarGameDoctrineChain[];
  role?: "MISSIONARY" | "VISIONARY";
  noRuinGate?: boolean;
  overrides?: string[];
}): TriageSuggestionDto[] {
  const evaluation = evaluateDecision(args);
  const suggestions: TriageSuggestionDto[] = [];

  for (const reason of evaluation.blockReasons) {
    const actions = triageActionsForReason({ mode: args.mode, targetId: args.targetId, reason });
    if (!actions.length) {
      suggestions.push(
        triageSuggestionSchema.parse({
          id: `${reason.code}-${args.mode}-${args.targetId}`,
          mode: args.mode,
          targetId: args.targetId,
          title: reason.code,
          reason: reason.message,
          priority: reasonPriority(reason),
          missingItems: reason.missingItems,
          expectedReadinessDelta: reason.code === "PREDECESSOR_MISSING" ? 8 : 10
        })
      );
      continue;
    }
    for (const action of actions) {
      suggestions.push(
        triageSuggestionSchema.parse({
          id: `${reason.code}-${action.kind}-${args.mode}-${args.targetId}`,
          mode: args.mode,
          targetId: args.targetId,
          title: action.label,
          reason: reason.message,
          priority: reasonPriority(reason),
          missingItems: reason.missingItems,
          actionKind: action.kind,
          actionPayload: action.payload,
          expectedReadinessDelta: reason.code === "NO_RUIN_GATE_FAILED" ? 0 : 10
        })
      );
    }
  }

  return suggestions.sort((left, right) => {
    if (right.priority !== left.priority) return right.priority - left.priority;
    if (right.expectedReadinessDelta !== left.expectedReadinessDelta) return right.expectedReadinessDelta - left.expectedReadinessDelta;
    return left.id.localeCompare(right.id);
  });
}

export function evaluateDecisionWithTriage(args: {
  mode: WarGameModeSpec;
  targetId: string;
  state: KhalState;
  sourceMapProfiles?: SourceMapProfileDto[];
  responseLogic?: WarGameDoctrineChain[];
  role?: "MISSIONARY" | "VISIONARY";
  noRuinGate?: boolean;
  overrides?: string[];
}): TriageEvaluationSnapshotDto {
  const evaluation = evaluateDecision(args);
  const suggestions = buildDeterministicTriage(args);
  const nextAction = suggestions[0]?.title ?? (evaluation.blocked ? "Resolve blockers" : "Proceed to action plan emit");
  return triageEvaluationSnapshotSchema.parse({
    mode: args.mode,
    targetId: args.targetId,
    blocked: evaluation.blocked,
    readinessScore: evaluation.readinessScore,
    nextAction,
    suggestions,
    generatedAtIso: new Date().toISOString()
  });
}

export function buildDraftMutations(args: {
  mode: WarGameModeSpec;
  targetId?: string;
  prompt: string;
  state: KhalState;
}): Array<Record<string, unknown>> {
  const lower = args.prompt.toLowerCase();
  const out: Array<Record<string, unknown>> = [];
  if (args.mode === "affair" || lower.includes("affair")) {
    out.push({
      kind: "CREATE_AFFAIR",
      payload: {
        title: "Agent Draft Affair",
        domainId: args.targetId ?? args.state.domains[0]?.id ?? "general",
        status: "NOT_STARTED",
        stakes: 5,
        risk: 5
      }
    });
  }
  if (args.mode === "interest" || lower.includes("interest")) {
    out.push({
      kind: "CREATE_INTEREST",
      payload: {
        title: "Agent Draft Interest",
        domainId: args.targetId ?? args.state.domains[0]?.id ?? "general",
        status: "NOT_STARTED",
        stakes: 5,
        risk: 5,
        convexity: 6,
        labStage: "FORGE",
        hedgePct: 90,
        edgePct: 10
      }
    });
  }
  if (lower.includes("task") || lower.includes("queue")) {
    out.push({
      kind: "CREATE_TASK",
      payload: {
        title: "Agent Draft Execution Task",
        sourceType: "PLAN",
        sourceId: "mission-global",
        horizon: "WEEK",
        status: "NOT_STARTED"
      }
    });
  }
  return out;
}
