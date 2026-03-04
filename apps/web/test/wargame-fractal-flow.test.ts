import { describe, expect, it } from "vitest";
import { evaluateWarGameMode } from "../components/war-room-v2/war-game-protocol";
import { buildDeterministicTriage } from "../lib/decision-spec";
import type { KhalState } from "@khal/domain";

describe("wargame fractal flow", () => {
  it("flags missing grammar fields deterministically", () => {
    const result = evaluateWarGameMode({
      mode: "domain",
      role: "MISSIONARY",
      readinessScore: 64,
      filledFieldKeys: ["domain_class", "stakes"],
      completedModes: { source: true }
    });
    expect(result.missingRequiredFields).toEqual(["risk_map", "fragility_profile", "ends_means_posture"]);
    expect(result.blockedActions).toBe(true);
  });

  it("keeps lineage mode unblocked for visionary when dependencies are met and grammar complete", () => {
    const result = evaluateWarGameMode({
      mode: "lineage",
      role: "VISIONARY",
      readinessScore: 88,
      filledFieldKeys: ["exposure_map", "stake_scaling", "blast_radius", "intergenerational_risk"],
      completedModes: { source: true, domain: true }
    });
    expect(result.dependency.missingModes).toEqual([]);
    expect(result.blockedActions).toBe(false);
  });

  it("triage returns exact missing items for blocked domain grammar", () => {
    const state: KhalState = {
      domains: [
        {
          id: "d1",
          name: "D1",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ],
      laws: [],
      crafts: [],
      ends: [],
      fragilities: [],
      affairs: [],
      interests: [],
      tasks: [],
      missionNodes: [],
      missionGraph: { nodes: [], dependencies: [] },
      warRoomNarrative: {},
      sources: [],
      lineages: { nodes: [], entities: [] },
      lineageRisks: [],
      doctrine: { rulebooks: [], rules: [], domainPnLLadders: [] }
    };
    const triage = buildDeterministicTriage({ mode: "domain", targetId: "d1", state, role: "MISSIONARY", noRuinGate: true });
    const grammar = triage.find((item) => item.title === "GRAMMAR_INCOMPLETE");
    expect(grammar?.missingItems).toContain("stakes");
    expect(grammar?.missingItems).toContain("risk_map");
  });
});
