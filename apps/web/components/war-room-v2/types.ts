export type Perspective = "macro" | "meso" | "micro" | "local" | string;
export type WarRoomViewState =
  | "dashboard"
  | "war-room"
  | "mission"
  | "laws"
  | "interests"
  | "lab"
  | "affairs"
  | "war-gaming"
  | "execution"
  | "crafts"
  | "time-horizon"
  | "lineages";
export type WarGameMode = "source" | "domain" | "affair" | "interest" | "craft" | "mission" | "lineage";
export type WarGameRole = "MISSIONARY" | "VISIONARY";
export type ParityStatus = "exact" | "functionally_equivalent" | "drifted" | "missing";
export type DoctrineScopeType = "GLOBAL" | "MODE" | "ENTITY";
export type DoctrineRuleKind = "RULE" | "POLICY" | "OMISSION" | "TRIGGER" | "BARRIER" | "BET_RULE";
export type SourceMapDecisionType = "simple" | "complex";
export type SourceMapTailClass = "thin" | "fat" | "unknown";
export type SourceMapQuadrant = "Q1" | "Q2" | "Q3" | "Q4";

export interface UserProfile {
  name?: string;
  birthDate: string;
  lifeExpectancy: number;
  location?: string;
}

export interface StrategyMatrix {
  allies: number;
  enemies: number;
  overt: number;
  covert: number;
  offense: number;
  defense: number;
  conventional: number;
  unconventional: number;
}

export interface Law {
  id: string;
  name: string;
  description?: string;
  volatilitySource?: string;
  associatedCrafts?: string[];
}

export interface Domain {
  id: string;
  name: string;
  lawId?: string;
  volatilitySourceId?: string;
  volatilitySourceName?: string;
  volatility?: string;
  volatilitySource?: string;
  stakesText?: string;
  risksText?: string;
  fragilityText?: string;
  vulnerabilitiesText?: string;
  hedge?: string;
  edge?: string;
  heuristics?: string;
  tactics?: string;
  interestsText?: string;
  affairsText?: string;
}

export interface CraftHeap {
  id: string;
  title: string;
  type: "link" | "file" | string;
  url?: string;
}

export interface CraftModel {
  id: string;
  title: string;
  description?: string;
  heapIds: string[];
}

export interface CraftFramework {
  id: string;
  title: string;
  description?: string;
  modelIds: string[];
}

export interface CraftBarbellStrategy {
  id: string;
  title: string;
  hedge?: string;
  edge?: string;
  frameworkIds: string[];
}

export interface CraftKnowledgeStack {
  id: string;
  craftId: string;
  name: string;
  description?: string;
  sortOrder?: number;
}

export interface CraftKnowledgeProtocol {
  id: string;
  craftId: string;
  stackId?: string;
  name: string;
  description?: string;
  sortOrder?: number;
}

export interface CraftKnowledgeRule {
  id: string;
  craftId: string;
  protocolId?: string;
  statement: string;
  rationale?: string;
  sortOrder?: number;
}

export interface CraftKnowledgeHeuristic {
  id: string;
  craftId: string;
  protocolId?: string;
  ruleId?: string;
  statement: string;
  explanation?: string;
  sortOrder?: number;
}

export interface CraftKnowledgeWargame {
  id: string;
  craftId: string;
  name: string;
  description?: string;
  objective?: string;
}

export interface CraftKnowledgeScenario {
  id: string;
  wargameId: string;
  name: string;
  description?: string;
  sortOrder?: number;
}

export interface CraftKnowledgeThreat {
  id: string;
  scenarioId: string;
  name: string;
  description?: string;
  severity?: number;
}

export interface CraftKnowledgeResponse {
  id: string;
  threatId: string;
  name: string;
  description?: string;
  responseType?: string;
}

export interface CraftKnowledgeLink {
  id: string;
  sourceType: string;
  sourceId: string;
  targetType: string;
  targetId: string;
  linkType?: string;
  notes?: string;
  sortOrder?: number;
}

export interface CraftKnowledge {
  stacks: CraftKnowledgeStack[];
  protocols: CraftKnowledgeProtocol[];
  rules: CraftKnowledgeRule[];
  heuristics: CraftKnowledgeHeuristic[];
  wargames: CraftKnowledgeWargame[];
  scenarios: CraftKnowledgeScenario[];
  threats: CraftKnowledgeThreat[];
  responses: CraftKnowledgeResponse[];
  links: CraftKnowledgeLink[];
}

export interface Means {
  craftId: string;
  selectedHeuristicIds: string[];
}

export interface CraftHeuristic {
  id: string;
  title: string;
  content?: string;
  barbellStrategyIds: string[];
}

export interface Craft {
  id: string;
  name: string;
  description?: string;
  heaps: CraftHeap[];
  models: CraftModel[];
  frameworks: CraftFramework[];
  barbellStrategies: CraftBarbellStrategy[];
  heuristics: CraftHeuristic[];
  knowledge?: CraftKnowledge;
}

export interface Entity {
  id: string;
  name: string;
  type?: string;
  fragility?: "fragile" | "robust" | "antifragile" | string;
}

export interface Interest {
  id: string;
  title: string;
  domainId: string;
  perspective?: Perspective;
  stakes?: string | number;
  risk?: number;
  convexity?: number;
  status?: string;
  objectives?: string[];
  labStage?: "FORGE" | "WIELD" | "TINKER";
  hypothesis?: string;
  maxLossPct?: number;
  expiryDate?: string;
  killCriteria?: string[];
  hedgePct?: number;
  edgePct?: number;
  irreversibility?: number;
  evidenceNote?: string;
  downside?: string;
  asymmetryScore?: number;
  protocolReady?: boolean;
}

export interface Affair {
  id: string;
  title: string;
  domainId: string;
  interestId?: string;
  perspective?: Perspective;
  status?: string;
  stakes?: number;
  risk?: number;
  context: {
    associatedDomains: string[];
    volatilityExposure?: string;
  };
  means: Means;
  plan: {
    objectives: string[];
    uncertainty?: string;
    timeHorizon?: string;
  };
  strategy: {
    posture?: string;
    positioning?: string;
    mapping: {
      allies: string[];
      enemies: string[];
    };
  };
  entities: Entity[];
}

export interface Task {
  id: string;
  title: string;
  domainId: string;
  type?: "affair" | "interest" | string;
  sourceType?: "AFFAIR" | "INTEREST" | "PLAN" | "PREPARATION" | string;
  sourceId?: string;
  parentTaskId?: string;
  dependencyIds?: string[];
  horizon?: "WEEK" | "MONTH" | "QUARTER" | "YEAR" | string;
  dueDate?: string;
  notes?: string;
  priority: number;
  progress?: number;
  status?: "not_started" | "in_progress" | "done" | string;
  convexity?: number;
}

export interface CampaignStageStat {
  stage: "attempting" | "active" | "converged";
  count: number;
}

export interface CampaignSnapshot {
  id: string;
  title: string;
  interestId: string;
  interestTitle: string;
  affairId?: string;
  affairTitle?: string;
  status: "forming" | "running" | "converging";
  attemptCount: number;
  activeCount: number;
  convergedCount: number;
  conversionPct: number;
  fragilityBand: "fragile" | "robust";
  narrative: string;
  stages: CampaignStageStat[];
}

export interface OperationalNowItem {
  refType: "AFFAIR" | "INTEREST" | "TASK";
  refId: string;
  title: string;
  score: number;
  why: string;
  route: string;
}

export interface StakeTriadMetrics {
  lifeScore: number;
  timeScore: number;
  soulScore: number;
  openLineageRiskCount: number;
  overdueTaskCount: number;
  nearTermTaskCount: number;
  unscheduledTaskCount: number;
  schedulabilityCoverage: number;
  actionabilityCoverage: number;
}

export interface BarbellGuardrailMetrics {
  hedgeMass: number;
  edgeMass: number;
  hedgePct: number;
  edgePct: number;
  fragileMiddle: boolean;
  status: "hedge-heavy" | "fragile-middle" | "edge-heavy";
  activeObligationCount: number;
  activeOptionCount: number;
}

export interface AsymmetrySnapshot {
  markerX: number;
  markerY: number;
  balance: number;
  band: "fragile" | "neutral" | "antifragile";
  convexityMass: number;
  fragilityMass: number;
}

export interface HarmSignalPoint {
  id: string;
  label: string;
  value: number;
  spike: boolean;
}

export interface HarmSignalSnapshot {
  harmLevel: number;
  disorderPressure: number;
  openCriticalCount: number;
  signalBand: "stable" | "watch" | "critical";
  series: HarmSignalPoint[];
}

export interface FragilistaWatchItem {
  id: string;
  title: string;
  entityLabel: string;
  domainLabel: string;
  sourceLabel: string;
  score: number;
  sitgBand: "LOW" | "MEDIUM" | "HIGH";
  reason: string;
}

export interface ExecutionSplitMetrics {
  affairsScore: number;
  interestsScore: number;
  affairsCompletionPct: number;
  interestsExecutionPct: number;
  fragilityReductionProxy: number;
  convexityMass: number;
  affairsOpenCount: number;
  interestsActiveCount: number;
  imbalanceBand: "balanced" | "affairs-heavy" | "interests-heavy" | "fragile-middle";
}

export interface HudStatusSnapshot {
  protocolState: "NOMINAL" | "WATCH" | "CRITICAL";
  confidence: "HIGH" | "MEDIUM" | "LOW";
  dataQuality: "HIGH" | "MEDIUM" | "LOW";
  volatilityBand: "stable" | "watch" | "critical";
  fallbackUsed: boolean;
  invariantViolationCount: number;
  activeAlertCount: number;
  computedAtIso: string;
}

export interface LifeClockSnapshot {
  ageYears: number;
  lifeExpectancyYears: number;
  yearsRemaining: number;
  progressPct: number;
  runwayDays: number;
  runwayBand: "critical" | "watch" | "stable";
}

export interface AlertQueueItem {
  id: string;
  title: string;
  severity: "CRITICAL" | "WATCH" | "INFO";
  source: string;
  reason: string;
  nextAction?: string;
}

export interface SystemAnatomyNode {
  id: string;
  label: string;
  lane: "risk" | "robust" | "optionality";
  score: number;
}

export interface SystemAnatomyEdge {
  id: string;
  from: string;
  to: string;
  weight: number;
}

export interface SystemAnatomySnapshot {
  nodes: SystemAnatomyNode[];
  edges: SystemAnatomyEdge[];
  criticalNodeId?: string;
}

export interface ViaNegativaItem {
  id: string;
  title: string;
  pressure: number;
  source: string;
  reason: string;
}

export interface BlackSwanReadinessSnapshot {
  crisisMode: "CALM" | "WATCH" | "CRISIS";
  readinessScore: number;
  openCriticalRisks: number;
  trigger: string;
  nextAction: string;
}

export interface ExecutionDistributionSnapshot {
  defense: { total: number; done: number; inProgress: number };
  offense: { total: number; done: number; inProgress: number };
}

export interface NoRuinTripwireState {
  state: "NOMINAL" | "WATCH" | "BLOCK";
  reason: string;
  recoveryAction: string;
  riskyActionBlocked: boolean;
}

export interface RuinLedgerItem {
  id: string;
  title: string;
  domainId: string;
  sourceId?: string;
  irreversibility: number;
  fragilityScore: number;
  timeToImpactDays: number;
  hedgeStatus: "HEDGED" | "PARTIAL" | "UNHEDGED";
}

export interface DoctrineViolationEvent {
  id: string;
  severity: "HARD_GATE" | "SOFT";
  message: string;
  source: string;
  detectedAtIso: string;
}

export interface BlastRadiusNode {
  id: string;
  label: string;
  kind: "TASK" | "AFFAIR" | "INTEREST" | "DOMAIN" | "LINEAGE";
  risk: number;
}

export interface BlastRadiusEdge {
  id: string;
  from: string;
  to: string;
  weight: number;
}

export interface BlastRadiusSnapshot {
  nodes: BlastRadiusNode[];
  edges: BlastRadiusEdge[];
  criticalNodeId?: string;
}

export interface MissionBottleneck {
  id: string;
  title: string;
  domainId?: string;
  backlog: number;
  blockingLoad: number;
  bottleneckScore: number;
}

export interface HedgeCoverageCell {
  riskId: string;
  affairId: string;
  covered: boolean;
}

export interface ConvexityPipelineStage {
  id: "IDEAS" | "INTERESTS" | "QUEUED" | "EXECUTING" | "OUTCOMES";
  label: string;
  count: number;
}

export interface OptionalityBudgetState {
  usedPct: number;
  redlinePct: number;
  canAllocate: boolean;
  rationale: string;
}

export interface CounterfactualDelta {
  preparedDelta: number;
  unpreparedDelta: number;
  netGain: number;
  note: string;
}

export interface FragilityTimelinePoint {
  atIso: string;
  fragility: number;
  convexity: number;
}

export interface DecisionLatencySnapshot {
  signalToQueueMinutes: number;
  signalToQueueBand: "FAST" | "NORMAL" | "SLOW";
}

export interface DecisionReplayEvent {
  id: string;
  atIso: string;
  state: string;
  action: string;
  outcome: string;
}

export interface OutcomeAttribution {
  skillPct: number;
  luckPct: number;
  regimePct: number;
}

export interface AssumptionItem {
  id: string;
  statement: string;
  stale: boolean;
}

export interface RecoveryPlaybook {
  id: string;
  trigger: string;
  firstAction: string;
  owner: string;
}

export interface ConfidenceEvidenceMeta {
  confidence: "HIGH" | "MEDIUM" | "LOW";
  evidenceCount: number;
  recencyMinutes: number;
}

export type MayaLane = "CAVE" | "CONVEX";

export interface MayaSourceSignal {
  sourceId: string;
  sourceName: string;
  sourceCode?: string;
  domainIds: string[];
  mappedDomainCount: number;
  harmSignal: number;
  disorderPressure: number;
  caveScore: number;
  convexPotential: number;
  convexScore: number;
  inputVolatility: number;
  lane: MayaLane;
  conviction: number;
}

export interface MayaFlowSnapshot {
  sources: MayaSourceSignal[];
  convexSharePct: number;
  caveSharePct: number;
  heuristicMeansCoveragePct: number;
}

export type NoRuinState = "CONTROLLED" | "AT_RISK";

export interface IntentMirrorLevel {
  levelKey: "SELF" | "FAMILY" | "FRIENDS" | "COMMUNITY" | "STATE" | "NATION" | "HUMANITY" | "NATURE";
  label: string;
  nodeIds: string[];
  score: number | null;
  band: "critical" | "watch" | "stable" | "unmapped";
}

export interface IntentMirrorSnapshot {
  condition: "Causal Opacity: Active";
  signal: "Harm";
  principalLadder: IntentMirrorLevel[];
  noRuinState: NoRuinState;
  barbellState: "hedge-heavy" | "fragile-middle" | "edge-heavy";
  directive: string;
  convexSharePct: number;
  caveSharePct: number;
}

export type RiskBand = "critical" | "watch" | "stable";

export interface HeatCell {
  rowId: string;
  columnId: string;
  value: number;
  band: RiskBand;
  hint?: string;
}

export interface HeatColumn {
  id: string;
  label: string;
}

export interface HeatRow {
  id: string;
  label: string;
  meta?: string;
}

export interface FlowNode {
  id: string;
  label: string;
  value: number;
  meta?: string;
}

export interface FlowLane {
  id: string;
  label: string;
}

export interface FlowLink {
  id: string;
  sourceId: string;
  laneId: string;
  weight: number;
  lane: "CAVE" | "CONVEX" | "SERIAL" | "PARALLEL";
  label?: string;
}

export interface BalanceSegment {
  id: string;
  label: string;
  value: number;
  tone: "hedge" | "edge" | "risk" | "safe" | "watch";
}

export interface MissionTierVisual {
  id: string;
  riskId: string;
  domainId: string;
  tier: number;
  title: string;
  fragility: number;
  serialLoad: number;
  parallelLoad: number;
  conviction: number;
  flowWeight: number;
  stream: "hedge" | "edge";
  serialAffairs: string[];
  parallelInterests: string[];
}

export interface MissionVisualSnapshot {
  rows: MissionTierVisual[];
  heatColumns: HeatColumn[];
  heatRows: HeatRow[];
  heatCells: HeatCell[];
  flowNodes: FlowNode[];
  flowLanes: FlowLane[];
  flowLinks: FlowLink[];
  balanceSegments: BalanceSegment[];
}

export interface WarGamingVisualSnapshot {
  quadrantColumns: HeatColumn[];
  quadrantRows: HeatRow[];
  quadrantCells: HeatCell[];
  sourceNodes: FlowNode[];
  sourceLanes: FlowLane[];
  sourceLinks: FlowLink[];
  penaltySegments: BalanceSegment[];
}

export interface DomainPostureMetric {
  id: "stakes" | "risk" | "fragility";
  label: string;
  value: number;
}

export interface DomainVisualSnapshot {
  posture: DomainPostureMetric[];
  barbellSegments: BalanceSegment[];
  meansCoveragePct: number;
  riskRows: HeatRow[];
  riskColumns: HeatColumn[];
  riskCells: HeatCell[];
  riskTrend: number[];
}

export interface VirtueSpiralState {
  stage: "REDUCE_FRAGILITY" | "SECURE_SURVIVAL" | "ASYMMETRIC_BETS" | "GAIN_RESOURCES" | "DOMINANCE";
  score: number;
  trend: "UP" | "STABLE" | "DOWN";
  nextAction: string;
  openFragilityMass: number;
  convexityMass: number;
  executionVelocity: number;
}

export interface DualPathScenario {
  unpreparedScore: number;
  preparedScore: number;
  delta: number;
  ruinRisk: number;
  survivalOdds: number;
  timeToImpact: number;
  resourceBurn: number;
  criticalNode: string;
}

export interface DoNowCopilotCard {
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
}

export interface DecisionAccelerationMeta {
  computedAtIso: string;
  dataQuality: "HIGH" | "MEDIUM" | "LOW";
  invariantViolations: string[];
  fallbackUsed: boolean;
  protocolState: "NOMINAL" | "WATCH" | "CRITICAL";
}

export interface LabProtocolCheck {
  key: string;
  label: string;
  passed: boolean;
  detail?: string;
}

export interface LabSummaryMetrics {
  protocolIntegrity: number;
  blockedExperiments: number;
  averageAsymmetryScore: number;
  staleOptionalityCount: number;
}

export type SecondBrainProvider = "OBSIDIAN" | "NOTION";

export interface DecisionGuard {
  id: string;
  title: string;
  description: string;
  hard: boolean;
}

export interface DecisionModeSpec {
  mode: WarGameMode;
  title: string;
  narrative: string;
  requiredFields: string[];
  predecessors: WarGameMode[];
}

export interface DecisionSpec {
  version: string;
  pipelineStages: string[];
  guards: DecisionGuard[];
  modes: DecisionModeSpec[];
}

export interface DecisionBlockReason {
  code: string;
  message: string;
  guardId?: string;
  missingItems: string[];
  overridable: boolean;
}

export interface PipelineStageStatus {
  id: string;
  passed: boolean;
  message: string;
  missingItems: string[];
}

export interface DecisionEvaluationResult {
  mode: WarGameMode;
  targetId: string;
  blocked: boolean;
  readinessScore: number;
  missingRequiredFields: string[];
  blockReasons: DecisionBlockReason[];
  stages: PipelineStageStatus[];
  nextStage?: string;
}

export type DoctrineQuickActionKind =
  | "SET_INTEREST_MAX_LOSS_DEFAULT"
  | "SET_INTEREST_EXPIRY_DEFAULT_30D"
  | "ADD_INTEREST_KILL_CRITERIA_TEMPLATE"
  | "SET_INTEREST_BARBELL_90_10"
  | "SET_AFFAIR_THRESHOLD_TEMPLATE"
  | "SET_AFFAIR_PREP_TEMPLATE"
  | "SET_DOMAIN_BIMODAL_POSTURE_TEMPLATE"
  | "OPEN_SOURCE_DOCTRINE_CHAIN_PLAYBOOK"
  | "OPEN_SOURCE_SCENARIO_PLAYBOOK"
  | "OPEN_SOURCE_THREAT_PLAYBOOK"
  | "OPEN_SOURCE_RESPONSE_PLAYBOOK"
  | "TRIPWIRE_RECOVERY_PATH";

export interface DoctrineQuickAction {
  id: string;
  label: string;
  kind: DoctrineQuickActionKind;
  targetRef: {
    mode: WarGameMode;
    targetId: string;
  };
  payload: Record<string, unknown>;
  guardIds: string[];
}

export interface TriageSuggestion {
  id: string;
  mode: WarGameMode;
  targetId: string;
  title: string;
  reason: string;
  priority: number;
  missingItems: string[];
  actionKind?: DoctrineQuickActionKind;
  actionPayload?: Record<string, unknown>;
  expectedReadinessDelta: number;
}

export interface TriageEvaluationSnapshot {
  mode: WarGameMode;
  targetId: string;
  blocked: boolean;
  readinessScore: number;
  nextAction: string;
  suggestions: TriageSuggestion[];
  generatedAtIso: string;
}

export interface DecisionOverrideRecord {
  id: string;
  mode: WarGameMode;
  targetId: string;
  guardIds: string[];
  overrideReason: string;
  operator: string;
  timestamp: string;
}

export interface WarGameGrammarField {
  key: string;
  label: string;
  required: boolean;
  description: string;
}

export interface WarGameGrammarSpec {
  mode: WarGameMode;
  title: string;
  narrative: string;
  fields: WarGameGrammarField[];
}

export interface WarGameDependencyStatus {
  mode: WarGameMode;
  requiredModes: WarGameMode[];
  missingModes: WarGameMode[];
  blocked: boolean;
}

export interface WarGameModeEvaluation {
  mode: WarGameMode;
  role: WarGameRole;
  readinessScore: number;
  missingRequiredFields: string[];
  dependency: WarGameDependencyStatus;
  blockedActions: boolean;
  nextRecommendedMode?: WarGameMode;
}

export interface AppData {
  user: UserProfile;
  strategyMatrix: StrategyMatrix;
  laws: Law[];
  domains: Domain[];
  crafts: Craft[];
  interests: Interest[];
  affairs: Affair[];
  tasks: Task[];
  sources?: VolatilitySourceDto[];
  missionGraph?: MissionGraphDto;
  lineages?: {
    nodes: LineageNodeDto[];
    entities: LineageEntityDto[];
  };
  lineageRisks?: LineageRiskDto[];
  doctrine?: {
    rulebooks: DoctrineRulebookDto[];
    rules: DoctrineRuleDto[];
    domainPnLLadders: DomainPnLLadderLevelDto[];
  };
  decisionAcceleration?: {
    virtueSpiral: VirtueSpiralState;
    pathComparator: DualPathScenario;
    copilot: DoNowCopilotCard;
  };
  decisionAccelerationMeta?: DecisionAccelerationMeta;
  tripwire?: NoRuinTripwireState;
  ruinLedger?: RuinLedgerItem[];
  violationFeed?: DoctrineViolationEvent[];
  latency?: DecisionLatencySnapshot;
  counterfactual?: CounterfactualDelta;
  confidence?: ConfidenceEvidenceMeta;
  responseLogic?: import("../../lib/war-room/bootstrap").WarGameDoctrineChain[];
  optionalityBudget?: OptionalityBudgetState;
  fragilityTimeline?: FragilityTimelinePoint[];
  decisionReplay?: DecisionReplayEvent[];
  blastRadius?: BlastRadiusSnapshot;
  missionBottlenecks?: MissionBottleneck[];
  hedgeCoverage?: HedgeCoverageCell[];
  convexityPipeline?: ConvexityPipelineStage[];
  outcomeAttribution?: OutcomeAttribution;
  assumptions?: AssumptionItem[];
  recoveryPlaybooks?: RecoveryPlaybook[];
}

export interface DeterministicFallbackContext {
  entityId: string;
  min?: number;
  max?: number;
}

export interface TimeHorizonProfileDto {
  focusText: string;
  dobIso: string;
  lifeExpectancyYears: number;
}

export interface TimeHorizonDeadlineDto {
  id: string;
  label: string;
  dueAt: string;
  sortOrder: number;
}

export interface VolatilitySourceDto {
  id: string;
  code: string;
  name: string;
  sortOrder: number;
  domainCount: number;
  domains?: VolatilitySourceDomainLinkDto[];
  mapProfiles?: SourceMapProfileDto[];
}

export interface SourceMapProfileDto {
  id: string;
  sourceId: string;
  domainId: string;
  decisionType: SourceMapDecisionType;
  tailClass: SourceMapTailClass;
  quadrant: SourceMapQuadrant;
  methodPosture: string;
  notes?: string;
  stakesText?: string;
  risksText?: string;
  playersText?: string;
  lineageThreatText?: string;
  fragilityPosture?: string;
  vulnerabilitiesText?: string;
  hedgeText?: string;
  edgeText?: string;
  primaryCraftId?: string;
  heuristicsText?: string;
  avoidText?: string;
  affairId?: string;
  interestId?: string;
}

export interface DomainStrategyDetailDto {
  domainId: string;
  stakesText?: string;
  risksText?: string;
  fragilityText?: string;
  vulnerabilitiesText?: string;
  hedgeText?: string;
  edgeText?: string;
  heuristicsText?: string;
  tacticsText?: string;
  interestsText?: string;
  affairsText?: string;
}

export interface MilestoneDto {
  title: string;
  dueAt?: string;
  status?: string;
}

export interface ThresholdDto {
  name: string;
  value: string;
}

export interface CriteriaDto {
  name: string;
  description?: string;
}

export interface PlanBlueprintDto {
  id: string;
  sourceType: "SOURCE" | "DOMAIN" | "AFFAIR" | "INTEREST" | "CRAFT" | "MISSION" | "LINEAGE";
  sourceId: string;
  title: string;
  scheduleStart?: string;
  scheduleEnd?: string;
  cadence?: string;
  milestones: MilestoneDto[];
  criteria: CriteriaDto[];
  thresholds: ThresholdDto[];
  preparation: Record<string, unknown>;
  extras: Record<string, unknown>;
  status: string;
  lineageNodeId?: string;
  actorType?: "personal" | "private" | "public" | string;
  riskRegisterIds?: string[];
}

export interface OrkDto {
  title: string;
  description?: string;
}

export interface KpiDto {
  name: string;
  target?: string;
  current?: string;
  unit?: string;
}

export interface ReadinessBreakdownDto {
  missingPredecessorPenalty: number;
  orkPenalty: number;
  kpiPenalty: number;
  thresholdPenalty: number;
  preparationPenalty: number;
  hedgeEdgePenalty: number;
  fragilityPenalty: number;
  doctrinePenalty: number;
  totalPenalty: number;
}

export interface ProtocolExtrasDto {
  protocolVersion: string;
  mode: "SOURCE" | "DOMAIN" | "AFFAIR" | "INTEREST" | "CRAFT" | "MISSION" | "LINEAGE";
  readinessScore: number;
  readinessBand: "ready" | "conditional" | "fragile";
  readinessBreakdown: ReadinessBreakdownDto;
  gates: {
    noRuinGate: boolean;
    ergodicityGate: boolean;
    metricLimitGate: boolean;
    jensenGate?: boolean;
    barbellGate?: boolean;
  };
  fragilityProfile: {
    shape: "concave" | "neutral" | "convex";
    shortVol: boolean;
    longVol: boolean;
  };
  meansEndsMap: {
    means: string;
    ends: string;
    hedge: string;
    edge: string;
  };
  riskRewardSummary: string;
  orks?: OrkDto[];
  kpis?: KpiDto[];
  doctrineVersion?: string;
  ruleChecks?: RuleCheckDto[];
  policyAcknowledgements?: string[];
  bets?: BetDto[];
  skinInGame?: SkinInGameDto;
  omissionCadence?: OmissionCadenceDto;
  domainPnLSignal?: DomainPnLSignalDto;
}

export interface RuleCheckDto {
  ruleId: string;
  passed: boolean;
  note?: string;
}

export interface SkinInGameDto {
  capitalAtRisk?: string;
  timeAtRisk?: string;
  reputationAtRisk?: string;
  breachPenalty?: string;
}

export interface OmissionCadenceDto {
  cadence: "daily" | "weekly" | "monthly" | string;
  reminder?: string;
}

export interface BetDto {
  title: string;
  thesis?: string;
  maxLoss?: string;
  expiry?: string;
}

export interface DomainPnLSignalDto {
  fragilityRemoved?: string;
  robustnessGained?: string;
  optionalityCreated?: string;
}

export interface DoctrineRulebookDto {
  id: string;
  scopeType: DoctrineScopeType;
  scopeRef: string;
  name: string;
  active: boolean;
}

export interface DoctrineRuleDto {
  id: string;
  rulebookId: string;
  kind: DoctrineRuleKind;
  code: string;
  statement: string;
  triggerText?: string;
  actionText?: string;
  failureCostText?: string;
  severity: "HARD_GATE" | "SOFT";
  stage?: "A" | "B" | "C" | "D" | "E";
  sortOrder: number;
  active: boolean;
}

export interface DomainPnLLadderLevelDto {
  id: string;
  domainId: string;
  level: number;
  levelName: string;
  threshold: Record<string, unknown>;
  status: "LOCKED" | "ACTIVE" | "PASSED" | string;
  evidence: Record<string, unknown>;
}

export interface MissionGraphNodeDto {
  id: string;
  missionId: string;
  refType: "MISSION" | "SOURCE" | "DOMAIN" | "END" | "AFFAIR" | "INTEREST" | "LINEAGE" | "TASK" | string;
  refId: string;
  parentNodeId?: string;
  sortOrder: number;
}

export interface MissionGraphDependencyDto {
  missionNodeId: string;
  dependsOnNodeId: string;
}

export interface MissionGraphDto {
  nodes: MissionGraphNodeDto[];
  dependencies: MissionGraphDependencyDto[];
}

export interface VolatilitySourceDomainLinkDto {
  id: string;
  sourceId: string;
  domainId: string;
  dependencyKind: "PRIMARY" | "SECONDARY" | "CASCADE" | string;
  pathWeight: number;
}

export interface LineageNodeDto {
  id: string;
  level: "SELF" | "FAMILY" | "STATE" | "NATION" | "HUMANITY" | "NATURE" | string;
  name: string;
  parentId?: string;
  sortOrder: number;
}

export interface LineageEntityDto {
  id: string;
  lineageNodeId: string;
  actorType: "personal" | "private" | "public" | string;
  label: string;
  description?: string;
}

export interface LineageRiskDto {
  id: string;
  sourceId: string;
  domainId: string;
  lineageNodeId: string;
  actorType?: "personal" | "private" | "public" | string;
  title: string;
  exposure: number;
  dependency: number;
  irreversibility: number;
  optionality: number;
  responseTime: number;
  fragilityScore: number;
  status: "OPEN" | "MITIGATING" | "RESOLVED" | "INCOMPLETE" | string;
  notes?: string;
}

export interface TalebFragilityInputDto {
  exposure: number;
  dependency: number;
  irreversibility: number;
  optionality: number;
  responseTime: number;
}
