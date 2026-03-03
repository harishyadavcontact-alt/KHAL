export type Perspective = "macro" | "meso" | "micro" | "local" | string;
export type WarRoomViewState =
  | "dashboard"
  | "war-room"
  | "mission"
  | "laws"
  | "interests"
  | "affairs"
  | "war-gaming"
  | "execution"
  | "crafts"
  | "time-horizon"
  | "lineages";
export type WarGameMode = "source" | "domain" | "affair" | "interest" | "mission" | "lineage";
export type ParityStatus = "exact" | "functionally_equivalent" | "drifted" | "missing";
export type DoctrineScopeType = "GLOBAL" | "MODE" | "ENTITY";
export type DoctrineRuleKind = "RULE" | "POLICY" | "OMISSION" | "TRIGGER" | "BARRIER" | "BET_RULE";

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
  sourceType: "SOURCE" | "DOMAIN" | "AFFAIR" | "INTEREST" | "MISSION" | "LINEAGE";
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
  mode: "SOURCE" | "DOMAIN" | "AFFAIR" | "INTEREST" | "MISSION" | "LINEAGE";
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
