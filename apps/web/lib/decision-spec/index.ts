import type { Affair, Craft, Interest, KhalState, Task } from "@khal/domain";
import type { SourceMapProfileDto } from "../../components/war-room-v2/types";
import type { WarGameDoctrineChain } from "../war-room/bootstrap";
import { missingDoctrineForSourceProfiles } from "../doctrine/gaps";
import { methodPostureForQuadrant } from "../war-room/source-map";
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
  type LineagePressureSummaryDto,
  type StateOfArtAssessmentDto,
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

const LINEAGE_LEVEL_WEIGHT: Record<string, number> = {
  SELF: 1,
  FAMILY: 2,
  FRIENDS: 2,
  COMMUNITY: 3,
  TRIBE: 3,
  STATE: 4,
  NATION: 5,
  HUMANITY: 6,
  NATURE: 7
};

const LINEAGE_POLICY_BAND_SCORE: Record<LineagePressureSummaryDto["policyBand"], number> = {
  LOCAL: 0,
  ELEVATED: 1,
  SYSTEMIC: 2,
  CIVILIZATIONAL: 3,
  EXISTENTIAL: 4
};

function lineageLevelWeight(level?: string | null): number {
  if (!level) return 1;
  return LINEAGE_LEVEL_WEIGHT[String(level).toUpperCase()] ?? 1;
}

function lineageLevelLabel(state: KhalState, lineageNodeId?: string | null): string {
  const node = state.lineages?.nodes?.find((item) => item.id === lineageNodeId);
  return String(node?.level ?? "SELF").toUpperCase();
}

function relevantLineageRisks(mode: WarGameModeSpec, targetId: string, state: KhalState) {
  const openRisks = (state.lineageRisks ?? []).filter((risk) => risk.status !== "RESOLVED");
  if (mode === "source") return openRisks.filter((risk) => risk.sourceId === targetId);
  if (mode === "domain") return openRisks.filter((risk) => risk.domainId === targetId);
  if (mode === "affair") {
    const affair = state.affairs.find((item) => item.id === targetId);
    return affair ? openRisks.filter((risk) => risk.domainId === affair.domainId) : [];
  }
  if (mode === "interest") {
    const interest = state.interests.find((item) => item.id === targetId);
    return interest ? openRisks.filter((risk) => risk.domainId === interest.domainId) : [];
  }
  if (mode === "lineage") {
    if (targetId === "global") return openRisks;
    return openRisks.filter((risk) => risk.lineageNodeId === targetId);
  }
  if (mode === "mission") return openRisks;
  return [];
}

function mean(values: number[]): number {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function numericStake(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function computeStakeSignal(mode: WarGameModeSpec, targetId: string, state: KhalState, risks: NonNullable<KhalState["lineageRisks"]>): number {
  if (mode === "affair") {
    const affair = state.affairs.find((item) => item.id === targetId);
    return numericStake(affair?.stakes);
  }
  if (mode === "interest") {
    const interest = state.interests.find((item) => item.id === targetId);
    return numericStake(interest?.stakes) + Math.max(0, numericStake(interest?.convexity) / 2);
  }
  if (mode === "domain") {
    const fragilityStake = state.fragilities.filter((item) => item.domainId === targetId).reduce((sum, item) => sum + numericStake(item.risk), 0);
    const affairStake = state.affairs.filter((item) => item.domainId === targetId).reduce((sum, item) => sum + numericStake(item.stakes), 0);
    const interestStake = state.interests.filter((item) => item.domainId === targetId).reduce((sum, item) => sum + numericStake(item.stakes), 0);
    return fragilityStake + affairStake + interestStake;
  }
  if (mode === "mission") {
    const affairStake = state.affairs.reduce((sum, item) => sum + numericStake(item.stakes), 0);
    const interestStake = state.interests.reduce((sum, item) => sum + numericStake(item.stakes), 0);
    return affairStake + interestStake;
  }
  return risks.reduce((sum, risk) => sum + numericStake(risk.exposure), 0);
}

function computeRiskSignal(mode: WarGameModeSpec, targetId: string, state: KhalState, risks: NonNullable<KhalState["lineageRisks"]>): number {
  const lineageRiskMean = mean(risks.map((risk) => numericStake(risk.fragilityScore)));
  if (mode === "affair") {
    const affair = state.affairs.find((item) => item.id === targetId);
    return numericStake(affair?.risk) + lineageRiskMean / 10;
  }
  if (mode === "interest") {
    const interest = state.interests.find((item) => item.id === targetId);
    return numericStake(interest?.risk) + numericStake(interest?.irreversibility) / 10 + lineageRiskMean / 10;
  }
  if (mode === "domain") {
    const fragilityRisk = state.fragilities.filter((item) => item.domainId === targetId).reduce((sum, item) => sum + numericStake(item.risk), 0);
    return fragilityRisk + lineageRiskMean / 10;
  }
  if (mode === "mission") {
    const affairRisk = state.affairs.reduce((sum, item) => sum + numericStake(item.risk), 0);
    const interestRisk = state.interests.reduce((sum, item) => sum + numericStake(item.risk), 0);
    return affairRisk + interestRisk + lineageRiskMean / 10;
  }
  return lineageRiskMean / 10;
}

function computePolicyBand(args: {
  maxLevelWeight: number;
  dependencyWeight: number;
  irreversibilityWeight: number;
  stakeSignal: number;
  riskSignal: number;
}): LineagePressureSummaryDto["policyBand"] {
  if (args.maxLevelWeight >= LINEAGE_LEVEL_WEIGHT.NATURE || args.irreversibilityWeight >= 70) return "EXISTENTIAL";
  if (args.maxLevelWeight >= LINEAGE_LEVEL_WEIGHT.HUMANITY || args.irreversibilityWeight >= 45) return "CIVILIZATIONAL";
  if (args.maxLevelWeight >= LINEAGE_LEVEL_WEIGHT.STATE || args.dependencyWeight >= 18) return "SYSTEMIC";
  if (args.maxLevelWeight >= LINEAGE_LEVEL_WEIGHT.FAMILY || args.stakeSignal + args.riskSignal >= 10) return "ELEVATED";
  return "LOCAL";
}

function computeRequiredPosture(args: {
  policyBand: LineagePressureSummaryDto["policyBand"];
  maxLevelWeight: number;
  stakeSignal: number;
  riskSignal: number;
  irreversibilityWeight: number;
}): LineagePressureSummaryDto["requiredPosture"] {
  if (args.policyBand === "EXISTENTIAL" || args.irreversibilityWeight >= 70) return "NO_RUIN";
  if (args.policyBand === "CIVILIZATIONAL" || args.policyBand === "SYSTEMIC") return "HEDGE";
  if (args.stakeSignal >= 8 || args.riskSignal >= 8 || args.maxLevelWeight >= LINEAGE_LEVEL_WEIGHT.FAMILY) return "CAP_DOWNSIDE";
  return "OBSERVE";
}

function computeLineagePressure(mode: WarGameModeSpec, targetId: string, state: KhalState): LineagePressureSummaryDto | null {
  const risks = relevantLineageRisks(mode, targetId, state);
  if (!risks.length) return null;

  let maxLevelWeight = 0;
  let maxLevel = "SELF";
  let weightedExposure = 0;
  let weightedFragility = 0;
  let dependencyWeight = 0;
  let irreversibilityWeight = 0;
  let highestRiskTitle: string | undefined;
  let highestRiskScore = -1;

  for (const risk of risks) {
    const level = lineageLevelLabel(state, risk.lineageNodeId);
    const levelWeight = lineageLevelWeight(level);
    const exposure = Number(risk.exposure ?? 0);
    const dependency = Number(risk.dependency ?? 0);
    const fragility = Number(risk.fragilityScore ?? 0);
    const irreversibility = Number(risk.irreversibility ?? 0);
    const weightedScore = levelWeight * (exposure + dependency);
    weightedExposure += weightedScore;
    weightedFragility += levelWeight * fragility;
    dependencyWeight += levelWeight * dependency;
    irreversibilityWeight += levelWeight * irreversibility;
    if (levelWeight > maxLevelWeight) {
      maxLevelWeight = levelWeight;
      maxLevel = level;
    }
    if (weightedScore > highestRiskScore) {
      highestRiskScore = weightedScore;
      highestRiskTitle = risk.title;
    }
  }

  const stakeSignal = Number(computeStakeSignal(mode, targetId, state, risks).toFixed(2));
  const riskSignal = Number(computeRiskSignal(mode, targetId, state, risks).toFixed(2));
  const normalizedDependencyWeight = Number((dependencyWeight / Math.max(1, risks.length)).toFixed(2));
  const normalizedIrreversibilityWeight = Number((irreversibilityWeight / Math.max(1, risks.length)).toFixed(2));
  const policyBand = computePolicyBand({
    maxLevelWeight,
    dependencyWeight: normalizedDependencyWeight,
    irreversibilityWeight: normalizedIrreversibilityWeight,
    stakeSignal,
    riskSignal
  });
  const requiredPosture = computeRequiredPosture({
    policyBand,
    maxLevelWeight,
    stakeSignal,
    riskSignal,
    irreversibilityWeight: normalizedIrreversibilityWeight
  });

  return {
    maxLevel,
    maxLevelWeight,
    openRiskCount: risks.length,
    stakeSignal,
    riskSignal,
    dependencyWeight: normalizedDependencyWeight,
    irreversibilityWeight: normalizedIrreversibilityWeight,
    policyBand,
    requiredPosture,
    weightedExposure: Number(weightedExposure.toFixed(2)),
    weightedFragility: Number(weightedFragility.toFixed(2)),
    highestRiskTitle,
    hedgeRequired: requiredPosture === "HEDGE" || requiredPosture === "NO_RUIN"
  };
}

function sourceProfilesForMode(
  mode: WarGameModeSpec,
  targetId: string,
  state: KhalState,
  sourceMapProfiles: SourceMapProfileDto[] = []
): SourceMapProfileDto[] {
  if (mode === "source") return sourceMapProfiles.filter((item) => item.sourceId === targetId);
  if (mode === "domain") return sourceMapProfiles.filter((item) => item.domainId === targetId);
  if (mode === "affair") {
    const affair = state.affairs.find((item) => item.id === targetId);
    return affair ? sourceMapProfiles.filter((item) => item.domainId === affair.domainId) : [];
  }
  if (mode === "interest") {
    const interest = state.interests.find((item) => item.id === targetId);
    return interest ? sourceMapProfiles.filter((item) => item.domainId === interest.domainId) : [];
  }
  return [];
}

function preferredQuadrant(profiles: SourceMapProfileDto[]): SourceMapProfileDto["quadrant"] | undefined {
  const order: Record<SourceMapProfileDto["quadrant"], number> = { Q1: 1, Q2: 2, Q3: 3, Q4: 4 };
  return [...profiles]
    .sort((left, right) => (order[right.quadrant] ?? 0) - (order[left.quadrant] ?? 0))[0]
    ?.quadrant;
}

function postureCompatible(methodPosture: string | undefined, requiredPosture: LineagePressureSummaryDto["requiredPosture"] | undefined): boolean {
  if (!requiredPosture || requiredPosture === "OBSERVE") return true;
  const hay = String(methodPosture ?? "").toLowerCase();
  if (requiredPosture === "NO_RUIN") return hay.includes("no-ruin") || hay.includes("tail clipping") || hay.includes("limited intervention");
  if (requiredPosture === "HEDGE") return hay.includes("no-ruin") || hay.includes("precaution") || hay.includes("bounded") || hay.includes("capped exposure");
  return hay.includes("downside") || hay.includes("bounded") || hay.includes("heuristic") || hay.includes("capped");
}

function firstSentence(text?: string): string | null {
  const value = String(text ?? "").trim();
  if (!value) return null;
  const [sentence] = value.split(/[.!?]\s/);
  return sentence?.trim() || value;
}

function computeStateOfArtAssessment(args: {
  mode: WarGameModeSpec;
  targetId: string;
  state: KhalState;
  sourceMapProfiles?: SourceMapProfileDto[];
  lineagePressure: LineagePressureSummaryDto | null;
}): StateOfArtAssessmentDto | null {
  if (!["source", "domain", "affair", "interest"].includes(args.mode)) return null;

  const profiles = sourceProfilesForMode(args.mode, args.targetId, args.state, args.sourceMapProfiles);
  const domainId =
    args.mode === "domain" ? args.targetId :
    args.mode === "affair" ? args.state.affairs.find((item) => item.id === args.targetId)?.domainId :
    args.mode === "interest" ? args.state.interests.find((item) => item.id === args.targetId)?.domainId :
    profiles[0]?.domainId;
  const dominantQuadrant = preferredQuadrant(profiles);
  const inheritedPosture = dominantQuadrant ? methodPostureForQuadrant(dominantQuadrant) : "Classify map first; default to precaution under uncertainty.";
  const recommendedPosture =
    args.lineagePressure?.requiredPosture === "NO_RUIN"
      ? "No-ruin first. Tail clipping, capped exposure, and limited intervention override optimization."
      : args.lineagePressure?.requiredPosture === "HEDGE"
        ? "Precaution first. Protect downside before expressing any edge."
        : args.lineagePressure?.requiredPosture === "CAP_DOWNSIDE"
          ? "Cap downside explicitly. Keep exposure bounded and methods simple."
          : inheritedPosture;

  const mapComplete = profiles.length > 0 && profiles.every((profile) => Boolean(profile.decisionType && profile.tailClass && profile.quadrant && profile.methodPosture));
  const stoneComplete = profiles.length > 0 && profiles.every((profile) =>
    Boolean(
      profile.stakesText?.trim() &&
      profile.risksText?.trim() &&
      profile.lineageThreatText?.trim() &&
      profile.fragilityPosture?.trim() &&
      profile.vulnerabilitiesText?.trim()
    )
  );
  const endsComplete = profiles.length > 0
    ? profiles.every((profile) => Boolean(profile.hedgeText?.trim() && profile.edgeText?.trim()))
    : false;
  const meansComplete = profiles.length > 0
    ? profiles.every((profile) => Boolean(profile.primaryCraftId?.trim() && profile.heuristicsText?.trim() && profile.avoidText?.trim()))
    : false;

  const craftNames = Array.from(new Set(
    profiles
      .map((profile) => profile.primaryCraftId?.trim())
      .filter((value): value is string => Boolean(value))
      .map((craftId) => args.state.crafts.find((item) => item.id === craftId)?.name ?? craftId)
  ));
  const heuristicHints = Array.from(new Set(profiles.map((profile) => firstSentence(profile.heuristicsText)).filter((value): value is string => Boolean(value))));
  const avoidHints = Array.from(new Set(profiles.map((profile) => firstSentence(profile.avoidText)).filter((value): value is string => Boolean(value))));
  const admissibleMeans = [
    ...craftNames.slice(0, 2),
    ...heuristicHints.slice(0, 1),
    ...(args.lineagePressure?.requiredPosture === "NO_RUIN" ? ["tail clipping / limited intervention"] : []),
    ...(args.lineagePressure?.requiredPosture === "HEDGE" ? ["bounded inference / capped exposure"] : []),
    ...avoidHints.slice(0, 1).map((hint) => `avoid: ${hint}`)
  ];
  const requiredEnds =
    args.lineagePressure?.requiredPosture === "NO_RUIN" ? ["hedge", "edge only if capped"] :
    args.lineagePressure?.requiredPosture === "HEDGE" ? ["hedge", "small edge"] :
    args.lineagePressure?.requiredPosture === "CAP_DOWNSIDE" ? ["downside cap"] :
    ["observe"];
  const mapAligned = profiles.length === 0 || profiles.every((profile) => postureCompatible(profile.methodPosture, args.lineagePressure?.requiredPosture));

  return {
    dominantQuadrant,
    recommendedPosture,
    lineageAtThreat: args.lineagePressure?.maxLevel ?? profiles.find((profile) => profile.lineageThreatText?.trim())?.lineageThreatText,
    requiredEnds,
    admissibleMeans,
    stages: [
      {
        id: "map",
        complete: mapComplete && mapAligned,
        message: mapComplete
          ? mapAligned
            ? `Quadrant ${dominantQuadrant ?? "unknown"} is mapped and method posture is admissible.`
            : `Mapped posture is too weak for ${args.lineagePressure?.requiredPosture?.toLowerCase().replace("_", "-") ?? "current"} lineage conditions.`
          : "Decision type, tail class, quadrant, and method posture must be explicit."
      },
      {
        id: "stone",
        complete: stoneComplete,
        message: stoneComplete
          ? `Stakes, risks, fragility, and lineage threat are explicit${args.lineagePressure?.maxLevel ? ` at ${args.lineagePressure.maxLevel}` : ""}.`
          : "Stone is incomplete: define stakes, risks, lineage threat, fragility, and vulnerabilities."
      },
      {
        id: "ends",
        complete: endsComplete,
        message: endsComplete
          ? `Ends reflect ${requiredEnds.join(" + ")}.`
          : `Ends are incomplete: ${requiredEnds.join(" + ")} must be explicit.`
      },
      {
        id: "means",
        complete: meansComplete,
        message: meansComplete
          ? `Means are grounded in ${admissibleMeans.slice(0, 2).join(" | ") || "documented craft/heuristics"}.`
          : "Means are incomplete: assign craft, heuristics, and disallowed methods."
      }
    ]
  };
}

function missingDoctrineForSourceMode(profiles: SourceMapProfileDto[], responseLogic: WarGameDoctrineChain[]): string[] {
  return missingDoctrineForSourceProfiles(profiles, responseLogic);
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
  lineagePressure: LineagePressureSummaryDto | null;
  stateOfArt: StateOfArtAssessmentDto | null;
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

  if ((args.mode === "source" || args.mode === "domain") && args.stateOfArt) {
    const mapStage = args.stateOfArt.stages.find((stage) => stage.id === "map");
    if (mapStage && !mapStage.complete) {
      reasons.push({
        code: "STATE_OF_ART_POSTURE_MISMATCH",
        message: mapStage.message,
        missingItems: ["method posture", "lineage-aware map"],
        overridable: false
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

  if ((args.mode === "affair" || args.mode === "domain") && args.lineagePressure?.hedgeRequired) {
    const domainId =
      args.mode === "domain"
        ? args.targetId
        : args.state.affairs.find((item) => item.id === args.targetId)?.domainId ?? "";
    const { hedge } = hasDomainBarbellPosture(args.state, domainId);
    if (!hedge) {
      reasons.push({
        code: "LINEAGE_HEDGE_REQUIRED",
        message: `Lineage exposure is ${args.lineagePressure.policyBand.toLowerCase()} at ${args.lineagePressure.maxLevel}; ${args.lineagePressure.requiredPosture.toLowerCase().replace("_", "-")} posture is required before action.`,
        missingItems: ["hedge posture", `${args.lineagePressure.requiredPosture.toLowerCase()} policy`, args.lineagePressure.highestRiskTitle ?? "lineage risk coverage"].filter(Boolean) as string[],
        overridable: false
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
    if (args.lineagePressure?.hedgeRequired) {
      const insufficientHedge = !Number.isFinite(interest?.hedgePct) || Number(interest?.hedgePct ?? 0) <= 0;
      const missingMaxLoss = !Number.isFinite(interest?.maxLossPct);
      if (insufficientHedge || missingMaxLoss) {
        reasons.push({
          code: "LINEAGE_OPTIONALITY_UNHEDGED",
          message: `Interest touches ${args.lineagePressure.maxLevel}-level lineage exposure with ${args.lineagePressure.requiredPosture.toLowerCase().replace("_", "-")} posture required.`,
          missingItems: [insufficientHedge ? "hedgePct" : null, missingMaxLoss ? "maxLossPct" : null].filter(Boolean) as string[],
          overridable: false
        });
      }
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
  const lineagePressure = computeLineagePressure(args.mode, args.targetId, args.state);
  const stateOfArt = computeStateOfArtAssessment({
    mode: args.mode,
    targetId: args.targetId,
    state: args.state,
    sourceMapProfiles: args.sourceMapProfiles,
    lineagePressure
  });
  const guardReasons = evaluateGuards({
    mode: args.mode,
    targetId: args.targetId,
    state: args.state,
    noRuinGate: args.noRuinGate ?? true,
    overrides: args.overrides ?? [],
    lineagePressure,
    stateOfArt
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
  const lineagePenalty = lineagePressure
    ? Math.min(
        24,
        Math.round(
          lineagePressure.stakeSignal +
          lineagePressure.riskSignal +
          lineagePressure.dependencyWeight / 4 +
          lineagePressure.irreversibilityWeight / 6 +
          LINEAGE_POLICY_BAND_SCORE[lineagePressure.policyBand] * 2
        )
      )
    : 0;
  const readinessScore = Math.max(
    0,
    Math.min(100, 100 - missingRequiredFields.length * 10 - missingPredecessors.length * 8 - guardReasons.length * 12 - lineagePenalty)
  );

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
    nextStage: firstBlockedStage,
    lineagePressure: lineagePressure ?? undefined,
    stateOfArt: stateOfArt ?? undefined
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

  if (args.reason.code === "INTEREST_CONVEXITY_INCOMPLETE" || (args.mode === "interest" && args.reason.code === "GRAMMAR_INCOMPLETE")) {
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

  if (args.reason.code === "LINEAGE_HEDGE_REQUIRED") {
    return [
      action(
        "SET_DOMAIN_BIMODAL_POSTURE_TEMPLATE",
        "Set lineage-safe hedge posture template",
        { hedgeText: "Protect upper-layer lineage exposure before action.", edgeText: "Only keep upside that does not breach no-ruin constraints." }
      )
    ];
  }

  if (args.reason.code === "LINEAGE_OPTIONALITY_UNHEDGED") {
    return [
      action("SET_INTEREST_MAX_LOSS_DEFAULT", "Set max-loss default (10%)", { maxLossPct: 10 }),
      action("SET_INTEREST_BARBELL_90_10", "Set barbell split 90/10", { hedgePct: 90, edgePct: 10 })
    ];
  }

  if (args.mode === "source" && args.reason.code === "GRAMMAR_INCOMPLETE") {
    const has = (key: string) => args.reason.missingItems.includes(key);
    const route = (playbook: "chain" | "scenario" | "threat" | "response") =>
      `/crafts-library?${new URLSearchParams({ sourceId: args.targetId, playbook }).toString()}`;
    const out: DoctrineQuickActionDto[] = [];
    if (has("doctrine_chain")) {
      out.push(action("OPEN_SOURCE_DOCTRINE_CHAIN_PLAYBOOK", "Open doctrine-chain playbook", { route: route("chain") }));
    }
    if (has("scenario_logic")) {
      out.push(action("OPEN_SOURCE_SCENARIO_PLAYBOOK", "Open scenario playbook", { route: route("scenario") }));
    }
    if (has("threat_logic")) {
      out.push(action("OPEN_SOURCE_THREAT_PLAYBOOK", "Open threat playbook", { route: route("threat") }));
    }
    if (has("response_logic")) {
      out.push(action("OPEN_SOURCE_RESPONSE_PLAYBOOK", "Open response playbook", { route: route("response") }));
    }
    return out;
  }

  return [];
}

function reasonPriority(reason: DecisionBlockReasonDto): number {
  if (reason.code === "NO_RUIN_GATE_FAILED") return 100;
  if (reason.code === "COMPLEX_MONOMODAL_BLOCK") return 90;
  if (reason.code === "STATE_OF_ART_POSTURE_MISMATCH") return 89;
  if (reason.code === "AFFAIR_NO_HEDGE") return 85;
  if (reason.code === "INTEREST_CONVEXITY_INCOMPLETE") return 80;
  if (reason.code === "LINEAGE_HEDGE_REQUIRED") return 88;
  if (reason.code === "LINEAGE_OPTIONALITY_UNHEDGED") return 82;
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
    generatedAtIso: new Date().toISOString(),
    lineagePressure: evaluation.lineagePressure,
    stateOfArt: evaluation.stateOfArt
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
