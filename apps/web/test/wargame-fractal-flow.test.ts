import { describe, expect, it } from "vitest";
import { evaluateWarGameMode } from "../components/war-room-v2/war-game-protocol";

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
});

