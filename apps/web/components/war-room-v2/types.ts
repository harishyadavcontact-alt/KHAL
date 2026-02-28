export type Perspective = "macro" | "meso" | "micro" | "local" | string;
export type WarRoomViewState = "mission" | "laws" | "interests" | "affairs" | "war-gaming" | "execution" | "crafts";
export type ParityStatus = "exact" | "functionally_equivalent" | "drifted" | "missing";

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
  associatedCrafts?: string[];
}

export interface Domain {
  id: string;
  name: string;
  lawId?: string;
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
  stakes?: string;
  objectives?: string[];
}

export interface Affair {
  id: string;
  title: string;
  domainId: string;
  interestId?: string;
  perspective?: Perspective;
  status?: string;
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
  priority: number;
  progress?: number;
  status?: "not_started" | "in_progress" | "done" | string;
  convexity?: number;
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
}

export interface DeterministicFallbackContext {
  entityId: string;
  min?: number;
  max?: number;
}
