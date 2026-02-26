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
  refType: "END" | "AFFAIR" | "INTEREST" | "TASK";
  refId: EntityId;
  parentNodeId?: EntityId;
  sortOrder: number;
  dependencyIds: EntityId[];
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
  ends: End[];
  fragilities: Fragility[];
  affairs: Affair[];
  interests: Interest[];
  tasks: Task[];
  missionNodes: MissionNode[];
  warRoomNarrative: Record<string, unknown>;
}