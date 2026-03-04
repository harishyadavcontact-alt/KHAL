import { describe, expect, it } from "vitest";
import { WAR_GAME_GRAMMAR_REGISTRY, WAR_GAME_PREDECESSORS, calculateReadiness, evaluateWarGameMode } from "../components/war-room-v2/war-game-protocol";

describe("war-game-protocol readiness", () => {
  it("applies doctrine penalties for missing skin-in-game and omission cadence in affair mode", () => {
    const result = calculateReadiness({
      mode: "affair",
      completedStages: ["A", "B", "C", "D"],
      orkCount: 1,
      kpiCount: 1,
      hasThresholds: true,
      hasPreparation: true,
      hasHedgeEdge: true,
      hasFragilityProfile: true,
      hasSkinInGame: false,
      hasOmissionCadence: false,
      hasBetExpiry: true,
      unresolvedHardGateRules: 0,
      noRuinGate: true,
      ergodicityGate: true,
      metricLimitGate: true
    });
    expect(result.penalties.doctrinePenalty).toBe(10);
    expect(result.score).toBe(90);
  });

  it("hard-blocks execution when unresolved hard doctrine rules remain", () => {
    const result = calculateReadiness({
      mode: "interest",
      completedStages: ["A", "B", "C", "D", "E"],
      orkCount: 1,
      kpiCount: 1,
      hasThresholds: true,
      hasPreparation: true,
      hasHedgeEdge: true,
      hasFragilityProfile: true,
      hasSkinInGame: true,
      hasOmissionCadence: true,
      hasBetExpiry: true,
      unresolvedHardGateRules: 1,
      noRuinGate: true,
      ergodicityGate: true,
      metricLimitGate: true
    });
    expect(result.blocked).toBe(true);
  });

  it("registers craft mode grammar and predecessors", () => {
    expect(WAR_GAME_GRAMMAR_REGISTRY.craft.fields.length).toBeGreaterThan(0);
    expect(WAR_GAME_PREDECESSORS.craft).toEqual(["interest"]);
  });

  it("blocks missionary actions when predecessor modes are incomplete", () => {
    const evaluation = evaluateWarGameMode({
      mode: "craft",
      role: "MISSIONARY",
      readinessScore: 72,
      filledFieldKeys: ["heap_set", "model_extraction", "framework_assembly", "barbell_output", "heuristic_output"],
      completedModes: { source: true, domain: true, interest: false }
    });
    expect(evaluation.dependency.missingModes).toEqual(["interest"]);
    expect(evaluation.blockedActions).toBe(true);
  });

  it("allows visionary jumps with dependency warning if grammar is complete", () => {
    const evaluation = evaluateWarGameMode({
      mode: "craft",
      role: "VISIONARY",
      readinessScore: 72,
      filledFieldKeys: ["heap_set", "model_extraction", "framework_assembly", "barbell_output", "heuristic_output"],
      completedModes: { source: true, domain: true, interest: false }
    });
    expect(evaluation.dependency.missingModes).toEqual(["interest"]);
    expect(evaluation.blockedActions).toBe(false);
  });
});

