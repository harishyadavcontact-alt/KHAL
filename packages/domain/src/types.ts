export type EntityId = string;

export type Status = "NOT_STARTED" | "IN_PROGRESS" | "DONE" | "PARKED" | "WAITING";

export type TimeHorizon = "WEEK" | "MONTH" | "QUARTER" | "YEAR";

export type Mode = "MISSIONARY" | "VISIONARY";

export interface Domain {
  id: EntityId;
  name: string;
  description?: string;
  stateOfTheArtNotes?: string;
  stateOfAffairsNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface End {
  id: EntityId;
  domainId: EntityId;
  title: string;
  description?: string;
  targetDate?: string;
  priority: number;
  status: Status;
}

export interface Fragility {
  id: EntityId;
  domainId: EntityId;
  endId?: EntityId;
  title: string;
  description?: string;
  stakes: number;
  risk: number;
  fragilityScore?: number;
}

export interface AffairEntity {
  id: EntityId;
  name: string;
  type?: string;
  fragility?: "fragile" | "robust" | "antifragile";
}

export interface AffairMeans {
  craftId: EntityId;
  selectedHeuristicIds: EntityId[];
  methodology?: string;
  technology?: string;
  techniques?: string;
}

export interface Affair {
  id: EntityId;
  domainId: EntityId;
  fragilityId?: EntityId;
  endId?: EntityId;
  title: string;
  description?: string;
  timeline?: string;
  stakes: number;
  risk: number;
  fragilityScore?: number;
  status: Status;
  completionPct: number;
  context?: {
    associatedDomains: EntityId[];
    volatilityExposure?: string;
  };
  means?: AffairMeans;
  strategy?: {
    posture?: string;
    positioning?: string;
    mapping?: {
      allies: string[];
      enemies: string[];
    };
  };
  entities?: AffairEntity[];
}

export interface Interest {
  id: EntityId;
  domainId: EntityId;
  endId?: EntityId;
  title: string;
  description?: string;
  stakes: number;
  risk: number;
  asymmetry?: string;
  upside?: string;
  downside?: string;
  convexity: number;
  status: Status;
  notes?: string;
  labStage?: "FORGE" | "WIELD" | "TINKER";
  hypothesis?: string;
  maxLossPct?: number;
  expiryDate?: string;
  killCriteria?: string[];
  hedgePct?: number;
  edgePct?: number;
  irreversibility?: number;
  evidenceNote?: string;
}

export type PortfolioStrategicRole = "core" | "option" | "probe" | "archive" | "killed";
export type PortfolioStage = "idea" | "framing" | "build" | "shipping" | "traction" | "stalled" | "archived";
export type PortfolioSignalBand = "low" | "watch" | "high";
export type PortfolioShipType = "code" | "spec" | "doc" | "design" | "release" | "research" | "prompt";
export type PortfolioEvidenceType = "user-signal" | "metric" | "observation" | "decision" | "market" | "technical";
export type PortfolioDecisionGateType = "continue" | "scale" | "pause" | "archive" | "kill";
export type PortfolioDecisionGateStatus = "open" | "watch" | "cleared" | "triggered";
export type PortfolioExperimentStatus = "planned" | "active" | "paused" | "complete" | "killed";
export type PortfolioRepoAdapterKind = "manual" | "meta_json";

export interface PortfolioProject {
  id: EntityId;
  slug: string;
  name: string;
  tagline?: string;
  strategicRole: PortfolioStrategicRole;
  stage: PortfolioStage;
  mission?: string;
  wedge?: string;
  rightTail?: string;
  leftTail?: string;
  currentExperiment?: string;
  successMetric?: string;
  killCriteria?: string;
  nextMilestone?: string;
  currentBottleneck?: string;
  signalBand: PortfolioSignalBand;
  repoUrl?: string;
  repoName?: string;
  defaultBranch?: string;
  lastShippedAt?: string;
  lastReviewedAt?: string;
  isActive: boolean;
  notes?: string;
  linkedInterestId?: EntityId;
  createdAt: string;
  updatedAt: string;
}

export interface PortfolioShipLog {
  id: EntityId;
  projectId: EntityId;
  title: string;
  type: PortfolioShipType;
  summary?: string;
  sourceLabel?: string;
  sourceUrl?: string;
  shippedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface PortfolioEvidence {
  id: EntityId;
  projectId: EntityId;
  title: string;
  type: PortfolioEvidenceType;
  summary: string;
  impact?: string;
  recordedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface PortfolioDecisionGate {
  id: EntityId;
  projectId: EntityId;
  title: string;
  gateType: PortfolioDecisionGateType;
  criteria: string;
  status: PortfolioDecisionGateStatus;
  dueAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PortfolioExperiment {
  id: EntityId;
  projectId: EntityId;
  title: string;
  hypothesis: string;
  expectedLearning?: string;
  status: PortfolioExperimentStatus;
  startedAt?: string;
  completedAt?: string;
  resultSummary?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PortfolioRepoAdapter {
  id: EntityId;
  projectId: EntityId;
  adapterKind: PortfolioRepoAdapterKind;
  sourcePath?: string;
  metadata?: Record<string, unknown>;
  lastIngestedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: EntityId;
  sourceType: "AFFAIR" | "INTEREST" | "PLAN" | "PREPARATION";
  sourceId: EntityId;
  parentTaskId?: EntityId;
  dependencyIds: EntityId[];
  title: string;
  notes?: string;
  horizon: TimeHorizon;
  dueDate?: string;
  status: Status;
  effortEstimate?: number;
}

export interface MissionNode {
  id: EntityId;
  refType: "MISSION" | "SOURCE" | "DOMAIN" | "END" | "AFFAIR" | "INTEREST" | "LINEAGE" | "TASK";
  refId: EntityId;
  parentNodeId?: EntityId;
  sortOrder: number;
  dependencyIds: EntityId[];
}

export interface MissionGraphNode {
  id: EntityId;
  missionId: EntityId;
  refType: "MISSION" | "SOURCE" | "DOMAIN" | "END" | "AFFAIR" | "INTEREST" | "LINEAGE" | "TASK";
  refId: EntityId;
  parentNodeId?: EntityId;
  sortOrder: number;
}

export interface MissionGraphDependency {
  missionNodeId: EntityId;
  dependsOnNodeId: EntityId;
}

export interface MissionGraph {
  nodes: MissionGraphNode[];
  dependencies: MissionGraphDependency[];
}

export interface Law {
  id: EntityId;
  name: string;
  description?: string;
  volatilitySource?: string;
  associatedCrafts?: EntityId[];
}

export interface VolatilitySourceDomainLink {
  id: EntityId;
  sourceId: EntityId;
  domainId: EntityId;
  dependencyKind: "PRIMARY" | "SECONDARY" | "CASCADE" | string;
  pathWeight: number;
}

export interface VolatilitySource {
  id: EntityId;
  code: string;
  name: string;
  sortOrder: number;
  domains: VolatilitySourceDomainLink[];
}

export interface LineageNode {
  id: EntityId;
  level: "SELF" | "FAMILY" | "STATE" | "NATION" | "HUMANITY" | "NATURE" | string;
  name: string;
  parentId?: EntityId;
  sortOrder: number;
}

export interface LineageEntity {
  id: EntityId;
  lineageNodeId: EntityId;
  actorType: "personal" | "private" | "public" | string;
  label: string;
  description?: string;
}

export interface LineageRisk {
  id: EntityId;
  sourceId: EntityId;
  domainId: EntityId;
  lineageNodeId: EntityId;
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

export type DoctrineScopeType = "GLOBAL" | "MODE" | "ENTITY";
export type DoctrineRuleKind = "RULE" | "POLICY" | "OMISSION" | "TRIGGER" | "BARRIER" | "BET_RULE";
export type DoctrineSeverity = "HARD_GATE" | "SOFT";
export type DoctrineStage = "A" | "B" | "C" | "D" | "E";

export interface DoctrineRulebook {
  id: EntityId;
  scopeType: DoctrineScopeType;
  scopeRef: string;
  name: string;
  active: boolean;
}

export interface DoctrineRule {
  id: EntityId;
  rulebookId: EntityId;
  kind: DoctrineRuleKind;
  code: string;
  statement: string;
  triggerText?: string;
  actionText?: string;
  failureCostText?: string;
  severity: DoctrineSeverity;
  stage?: DoctrineStage;
  sortOrder: number;
  active: boolean;
}

export interface DomainPnLLadderLevel {
  id: EntityId;
  domainId: EntityId;
  level: number;
  levelName: string;
  threshold: Record<string, unknown>;
  status: "LOCKED" | "ACTIVE" | "PASSED" | string;
  evidence: Record<string, unknown>;
}

export interface CraftHeap {
  id: EntityId;
  title: string;
  type: "link" | "file";
  url?: string;
  notes?: string;
}

export interface CraftModel {
  id: EntityId;
  title: string;
  description?: string;
  heapIds: EntityId[];
}

export interface CraftFramework {
  id: EntityId;
  title: string;
  description?: string;
  modelIds: EntityId[];
}

export interface CraftBarbellStrategy {
  id: EntityId;
  title: string;
  hedge?: string;
  edge?: string;
  frameworkIds: EntityId[];
}

export interface CraftHeuristic {
  id: EntityId;
  title: string;
  content?: string;
  barbellStrategyIds: EntityId[];
}

export interface Craft {
  id: EntityId;
  name: string;
  description?: string;
  heaps: CraftHeap[];
  models: CraftModel[];
  frameworks: CraftFramework[];
  barbellStrategies: CraftBarbellStrategy[];
  heuristics: CraftHeuristic[];
}

export interface DashboardDoNowItem {
  refType: "AFFAIR" | "INTEREST" | "TASK";
  refId: EntityId;
  title: string;
  score: number;
  why: string;
}

export interface KhalState {
  domains: Domain[];
  laws: Law[];
  crafts: Craft[];
  ends: End[];
  fragilities: Fragility[];
  affairs: Affair[];
  interests: Interest[];
  tasks: Task[];
  missionNodes: MissionNode[];
  missionGraph?: MissionGraph;
  warRoomNarrative: Record<string, unknown>;
  sources?: VolatilitySource[];
  lineages?: {
    nodes: LineageNode[];
    entities: LineageEntity[];
  };
  lineageRisks?: LineageRisk[];
  doctrine?: {
    rulebooks: DoctrineRulebook[];
    rules: DoctrineRule[];
    domainPnLLadders: DomainPnLLadderLevel[];
  };
}
