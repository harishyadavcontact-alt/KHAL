export const WARGAME_MODES = ["source", "domain", "affair", "interest", "craft", "mission", "lineage"] as const;

export type DecisionTreeModeId = (typeof WARGAME_MODES)[number];

export interface DecisionTreeModeDefinition {
  id: DecisionTreeModeId;
  title: string;
  protocolLabel: string;
  route: `/war-gaming/${DecisionTreeModeId}`;
  macroSection: "state-of-the-art" | "state-of-affairs" | "lineages" | "mission";
  predecessors: DecisionTreeModeId[];
  primaryQuestion: string;
  decisionLens: string;
  grammarSummary: string[];
}

export const DEFAULT_WARGAME_MODE: DecisionTreeModeId = "affair";
export const DEFAULT_WARGAME_ROUTE = `/war-gaming/${DEFAULT_WARGAME_MODE}` as const;

export const DECISION_TREE_MODES: readonly DecisionTreeModeDefinition[] = [
  {
    id: "source",
    title: "Source",
    protocolLabel: "Source WarGame",
    route: "/war-gaming/source",
    macroSection: "state-of-the-art",
    predecessors: [],
    primaryQuestion: "How does volatility propagate into downstream domains?",
    decisionLens: "Propagation, uncertainty, and first-order exposure",
    grammarSummary: ["profile", "linked domains", "propagation path", "uncertainty band"]
  },
  {
    id: "domain",
    title: "Domain",
    protocolLabel: "Domain WarGame",
    route: "/war-gaming/domain",
    macroSection: "state-of-the-art",
    predecessors: ["source"],
    primaryQuestion: "What posture removes fragility while preserving asymmetric upside?",
    decisionLens: "Risk map, fragility structure, and ends/means posture",
    grammarSummary: ["class", "stakes", "risk map", "fragility", "ends/means posture"]
  },
  {
    id: "affair",
    title: "Affair",
    protocolLabel: "Affair WarGame",
    route: "/war-gaming/affair",
    macroSection: "state-of-affairs",
    predecessors: ["domain"],
    primaryQuestion: "What obligation must be executed to reduce fragility now?",
    decisionLens: "Preparation, thresholds, and execution chain",
    grammarSummary: ["objective", "ORK/KPI", "preparation", "thresholds", "execution chain"]
  },
  {
    id: "interest",
    title: "Interest",
    protocolLabel: "Interest WarGame",
    route: "/war-gaming/interest",
    macroSection: "state-of-affairs",
    predecessors: ["domain"],
    primaryQuestion: "Is this bet convex, capped-downside, and protocol-ready?",
    decisionLens: "Hypothesis quality, max loss, expiry, and evidence",
    grammarSummary: ["hypothesis", "max loss", "expiry", "kill criteria", "barbell split", "evidence"]
  },
  {
    id: "craft",
    title: "Craft",
    protocolLabel: "Craft WarGame",
    route: "/war-gaming/craft",
    macroSection: "state-of-the-art",
    predecessors: ["interest"],
    primaryQuestion: "Do the means produce a reusable edge rather than scattered knowledge?",
    decisionLens: "Heap-to-heuristic conversion quality",
    grammarSummary: ["heap set", "model extraction", "framework assembly", "barbell output", "heuristic output"]
  },
  {
    id: "mission",
    title: "Mission",
    protocolLabel: "Mission WarGame",
    route: "/war-gaming/mission",
    macroSection: "mission",
    predecessors: ["affair", "interest", "lineage"],
    primaryQuestion: "Can this hierarchy execute without breaking no-ruin constraints?",
    decisionLens: "Hierarchy, dependency integrity, and readiness",
    grammarSummary: ["hierarchy", "dependency chain", "readiness", "no-ruin constraints"]
  },
  {
    id: "lineage",
    title: "Lineage",
    protocolLabel: "Lineage WarGame",
    route: "/war-gaming/lineage",
    macroSection: "lineages",
    predecessors: ["source", "domain"],
    primaryQuestion: "Where does exposure compound across generations and actors?",
    decisionLens: "Exposure scaling, blast radius, and irreversibility",
    grammarSummary: ["exposure map", "stake scaling", "blast radius", "intergenerational risk"]
  }
] as const;

export const DECISION_TREE_MODE_BY_ID = new Map(DECISION_TREE_MODES.map((mode) => [mode.id, mode]));

export function isDecisionTreeMode(value: string | null | undefined): value is DecisionTreeModeId {
  return Boolean(value && WARGAME_MODES.includes(value as DecisionTreeModeId));
}

export function parseDecisionTreeMode(value?: string | null): DecisionTreeModeId | null {
  if (!value) return null;
  return isDecisionTreeMode(value) ? value : null;
}

export function modeToPlanSourceType(mode: DecisionTreeModeId): "SOURCE" | "DOMAIN" | "AFFAIR" | "INTEREST" | "CRAFT" | "MISSION" | "LINEAGE" {
  if (mode === "source") return "SOURCE";
  if (mode === "domain") return "DOMAIN";
  if (mode === "affair") return "AFFAIR";
  if (mode === "interest") return "INTEREST";
  if (mode === "craft") return "CRAFT";
  if (mode === "mission") return "MISSION";
  return "LINEAGE";
}
