import { describe, expect, it } from "vitest";
import type { AppData } from "../components/war-room-v2/types";
import { computeLabSummary, withLabDerivedFields } from "../lib/war-room/operational-metrics";

function makeData(): AppData {
  return {
    user: { birthDate: "2000-01-01T00:00:00.000Z", lifeExpectancy: 80, name: "Operator", location: "Local" },
    strategyMatrix: { allies: 0, enemies: 0, overt: 0, covert: 0, offense: 0, defense: 0, conventional: 0, unconventional: 0 },
    laws: [],
    domains: [{ id: "domain-1", name: "Domain 1", stakesText: "high stakes", risksText: "critical" }],
    crafts: [],
    interests: [
      {
        id: "interest-forge",
        title: "Forge A",
        domainId: "domain-1",
        stakes: 6,
        risk: 4,
        convexity: 8,
        labStage: "FORGE",
        hypothesis: "Hypothesis A",
        maxLossPct: 20,
        expiryDate: "2099-01-01T00:00:00.000Z",
        killCriteria: ["Stop if no signal"],
        hedgePct: 80,
        edgePct: 20,
        irreversibility: 20,
        objectives: []
      },
      {
        id: "interest-wield",
        title: "Wield B",
        domainId: "domain-1",
        stakes: 7,
        risk: 3,
        convexity: 9,
        labStage: "WIELD",
        hypothesis: "",
        maxLossPct: 0,
        expiryDate: "2000-01-01T00:00:00.000Z",
        killCriteria: [],
        hedgePct: 40,
        edgePct: 40,
        irreversibility: 50,
        objectives: []
      }
    ],
    affairs: [],
    tasks: [],
    sources: [],
    missionGraph: { nodes: [], dependencies: [] },
    lineages: { nodes: [], entities: [] },
    lineageRisks: [],
    doctrine: { rulebooks: [], rules: [], domainPnLLadders: [] }
  };
}

describe("lab view metrics", () => {
  it("derives stable lane membership and readiness flags", () => {
    const data = makeData();
    const first = withLabDerivedFields(data);
    const second = withLabDerivedFields({ ...data, interests: [...data.interests] });

    expect(first.interests.map((interest) => interest.id)).toEqual(second.interests.map((interest) => interest.id));
    expect(first.interests.find((interest) => interest.id === "interest-forge")?.protocolReady).toBe(true);
    expect(first.interests.find((interest) => interest.id === "interest-wield")?.protocolReady).toBe(false);
  });

  it("computes summary counters for blocked and stale optionality", () => {
    const summary = computeLabSummary(withLabDerivedFields(makeData()));
    expect(summary.blockedExperiments).toBe(1);
    expect(summary.staleOptionalityCount).toBe(1);
    expect(summary.averageAsymmetryScore).toBeGreaterThan(0);
  });
});

