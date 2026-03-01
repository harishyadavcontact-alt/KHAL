import type { WarGameMode } from "./types";

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
  { id: "source", label: "Source WarGame" },
  { id: "domain", label: "Domain WarGame" },
  { id: "affair", label: "Affair WarGame" },
  { id: "interest", label: "Interest WarGame" },
  { id: "mission", label: "Mission WarGame" },
  { id: "lineage", label: "Lineage WarGame" }
];

export const WAR_GAME_STAGES: WarGameStage[] = [
  { id: "A", title: "Context Framing", description: "Define scope, target, and lineage context." },
  { id: "B", title: "Fragility Structure", description: "Map exposure, dependency, irreversibility, optionality." },
  { id: "C", title: "Means/Ends Barbell", description: "Define hedge obligations and edge optionality." },
  { id: "D", title: "ORK/KPI Threshold Prep", description: "Capture ORKs, KPIs, thresholds, and preparation." },
  { id: "E", title: "Readiness & Execute", description: "Score readiness and apply critical execute gates." }
];

export function modeToPlanSourceType(mode: WarGameMode): "SOURCE" | "DOMAIN" | "AFFAIR" | "INTEREST" | "MISSION" | "LINEAGE" {
  if (mode === "source") return "SOURCE";
  if (mode === "domain") return "DOMAIN";
  if (mode === "affair") return "AFFAIR";
  if (mode === "interest") return "INTEREST";
  if (mode === "mission") return "MISSION";
  return "LINEAGE";
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
