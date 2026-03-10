import type {
  AppData,
  CraftKnowledgeResponse,
  CraftKnowledgeScenario,
  CraftKnowledgeThreat,
  CraftKnowledgeWargame
} from "../../components/war-room-v2/types";

export interface WarGameThreatWithResponses extends CraftKnowledgeThreat {
  responses: CraftKnowledgeResponse[];
}

export interface WarGameScenarioWithThreats extends CraftKnowledgeScenario {
  threats: WarGameThreatWithResponses[];
}

export interface WarGameDoctrineChain extends CraftKnowledgeWargame {
  craftName: string;
  scenarios: WarGameScenarioWithThreats[];
}

export type WarGamingBootstrapData = Pick<
  AppData,
  | "user"
  | "domains"
  | "sources"
  | "lineages"
  | "affairs"
  | "interests"
  | "crafts"
  | "tasks"
  | "lineageRisks"
  | "missionGraph"
  | "doctrine"
  | "confidence"
  | "decisionAccelerationMeta"
  | "blastRadius"
  | "hedgeCoverage"
  | "violationFeed"
  | "optionalityBudget"
> & {
  onboarding: { onboarded: boolean };
  responseLogic: WarGameDoctrineChain[];
};

export function toWarGamingBootstrapData(
  data: AppData,
  onboarding: { onboarded: boolean },
  responseLogic: WarGameDoctrineChain[] = []
): WarGamingBootstrapData {
  return {
    user: data.user,
    domains: data.domains,
    sources: data.sources ?? [],
    lineages: data.lineages ?? { nodes: [], entities: [] },
    affairs: data.affairs,
    interests: data.interests,
    crafts: data.crafts,
    tasks: data.tasks,
    lineageRisks: data.lineageRisks ?? [],
    missionGraph: data.missionGraph,
    doctrine: data.doctrine,
    confidence: data.confidence,
    decisionAccelerationMeta: data.decisionAccelerationMeta,
    blastRadius: data.blastRadius,
    hedgeCoverage: data.hedgeCoverage,
    violationFeed: data.violationFeed,
    optionalityBudget: data.optionalityBudget,
    onboarding,
    responseLogic
  };
}
