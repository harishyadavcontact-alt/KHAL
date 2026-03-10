import type { WarGameDependencyStatus, WarGameGrammarSpec, WarGameMode, WarGameModeEvaluation, WarGameRole } from "./types";
import { getDecisionSpec } from "../../lib/decision-spec";
import { DECISION_TREE_MODES, DECISION_TREE_MODE_BY_ID, modeToPlanSourceType as registryModeToPlanSourceType } from "../../lib/decision-tree/registry";

export interface WarGameStage {
  id: "A" | "B" | "C" | "D" | "E";
  title: string;
  description: string;
}

export interface ReadinessInput {
  mode: WarGameMode;
  completedStages: Array<"A" | "B" | "C" | "D" | "E">;
  orkCount: number;
  kpiCount: number;
  hasThresholds: boolean;
  hasPreparation: boolean;
  hasHedgeEdge: boolean;
  hasFragilityProfile: boolean;
  hasSkinInGame: boolean;
  hasOmissionCadence: boolean;
  hasBetExpiry: boolean;
  unresolvedHardGateRules: number;
  noRuinGate: boolean;
  ergodicityGate: boolean;
  metricLimitGate: boolean;
}

export interface ReadinessResult {
  score: number;
  band: "ready" | "conditional" | "fragile";
  blocked: boolean;
  penalties: {
    missingPredecessorPenalty: number;
    orkPenalty: number;
    kpiPenalty: number;
    thresholdPenalty: number;
    preparationPenalty: number;
    hedgeEdgePenalty: number;
    fragilityPenalty: number;
    doctrinePenalty: number;
    totalPenalty: number;
  };
}

export const WAR_GAME_MODES: Array<{ id: WarGameMode; label: string }> = [
  ...DECISION_TREE_MODES.map((mode) => ({ id: mode.id, label: mode.protocolLabel }))
];

export const WAR_GAME_STAGES: WarGameStage[] = [
  { id: "A", title: "Context Framing", description: "Define scope, target, and lineage context." },
  { id: "B", title: "Fragility Structure", description: "Map exposure, dependency, irreversibility, optionality." },
  { id: "C", title: "Means/Ends Barbell", description: "Define hedge obligations and edge optionality." },
  { id: "D", title: "ORK/KPI Threshold Prep", description: "Capture ORKs, KPIs, thresholds, and preparation." },
  { id: "E", title: "Readiness & Execute", description: "Score readiness and apply critical execute gates." }
];

const DECISION_SPEC = getDecisionSpec();
export const WAR_GAME_PREDECESSORS: Record<WarGameMode, WarGameMode[]> = Object.fromEntries(
  DECISION_SPEC.modes.map((mode) => [mode.mode, mode.predecessors])
) as Record<WarGameMode, WarGameMode[]>;

export const WAR_GAME_GRAMMAR_REGISTRY: Record<WarGameMode, WarGameGrammarSpec> = Object.fromEntries(
  DECISION_SPEC.modes.map((mode) => [
    mode.mode,
    {
      mode: mode.mode,
      title: mode.title,
      narrative: `${mode.narrative} Primary question: ${DECISION_TREE_MODE_BY_ID.get(mode.mode)?.primaryQuestion ?? ""}`.trim(),
      fields: mode.requiredFields.map((key) => ({
        key,
        label: key.replaceAll("_", " "),
        required: true,
        description: `Required field: ${key}`
      }))
    }
  ])
) as Record<WarGameMode, WarGameGrammarSpec>;

export function modeToPlanSourceType(mode: WarGameMode): "SOURCE" | "DOMAIN" | "AFFAIR" | "INTEREST" | "CRAFT" | "MISSION" | "LINEAGE" {
  return registryModeToPlanSourceType(mode);
}

export function evaluateWarGameMode(args: {
  mode: WarGameMode;
  role: WarGameRole;
  readinessScore: number;
  filledFieldKeys: string[];
  completedModes: Partial<Record<WarGameMode, boolean>>;
}): WarGameModeEvaluation {
  const grammar = WAR_GAME_GRAMMAR_REGISTRY[args.mode];
  const requiredFieldKeys = grammar.fields.filter((field) => field.required).map((field) => field.key);
  const filled = new Set(args.filledFieldKeys);
  const missingRequiredFields = requiredFieldKeys.filter((field) => !filled.has(field));

  const requiredModes = WAR_GAME_PREDECESSORS[args.mode];
  const missingModes = requiredModes.filter((mode) => !args.completedModes[mode]);
  const dependency: WarGameDependencyStatus = {
    mode: args.mode,
    requiredModes,
    missingModes,
    blocked: missingModes.length > 0
  };
  const blockedActions = missingRequiredFields.length > 0 || (args.role === "MISSIONARY" && dependency.blocked);
  const nextRecommendedMode = missingModes[0] ?? (missingRequiredFields.length ? args.mode : undefined);

  return {
    mode: args.mode,
    role: args.role,
    readinessScore: Math.max(0, Math.min(100, Math.round(args.readinessScore))),
    missingRequiredFields,
    dependency,
    blockedActions,
    nextRecommendedMode
  };
}

export function calculateReadiness(input: ReadinessInput): ReadinessResult {
  const expectedOrder: Array<"A" | "B" | "C" | "D" | "E"> = ["A", "B", "C", "D", "E"];
  let missingPredecessorPenalty = 0;
  for (let i = 1; i < expectedOrder.length; i += 1) {
    const current = expectedOrder[i];
    if (!input.completedStages.includes(current)) continue;
    for (let j = 0; j < i; j += 1) {
      const predecessor = expectedOrder[j];
      if (!input.completedStages.includes(predecessor)) {
        missingPredecessorPenalty += 8;
      }
    }
  }

  const orkPenalty = input.orkCount > 0 ? 0 : 10;
  const kpiPenalty = input.kpiCount > 0 ? 0 : 10;
  const thresholdPenalty = input.hasThresholds ? 0 : 8;
  const preparationPenalty = input.hasPreparation ? 0 : 8;
  const hedgeEdgePenalty = input.hasHedgeEdge ? 0 : 12;
  const fragilityPenalty = input.hasFragilityProfile ? 0 : 12;
  let doctrinePenalty = 0;
  if (!input.hasSkinInGame) doctrinePenalty += 6;
  if (input.mode === "affair" && !input.hasOmissionCadence) doctrinePenalty += 4;
  if (input.mode === "interest" && !input.hasBetExpiry) doctrinePenalty += 4;
  const totalPenalty =
    missingPredecessorPenalty +
    orkPenalty +
    kpiPenalty +
    thresholdPenalty +
    preparationPenalty +
    hedgeEdgePenalty +
    fragilityPenalty +
    doctrinePenalty;

  const rawScore = 100 - totalPenalty;
  const score = rawScore < 0 ? 0 : rawScore;
  const band = score >= 85 ? "ready" : score >= 60 ? "conditional" : "fragile";
  const blocked = !(input.noRuinGate && input.ergodicityGate && input.metricLimitGate) || input.unresolvedHardGateRules > 0;

  return {
    score,
    band,
    blocked,
    penalties: {
      missingPredecessorPenalty,
      orkPenalty,
      kpiPenalty,
      thresholdPenalty,
      preparationPenalty,
      hedgeEdgePenalty,
      fragilityPenalty,
      doctrinePenalty,
      totalPenalty
    }
  };
}
