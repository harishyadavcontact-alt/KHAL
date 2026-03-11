import { describe, expect, it } from "vitest";
import { buildVisionCommandSnapshot } from "../lib/war-room/vision-command";
import type { AppData } from "../components/war-room-v2/types";

function baseData(): AppData {
  return {
    user: { birthDate: "1990-01-01", lifeExpectancy: 85 },
    strategyMatrix: { allies: 0, enemies: 0, overt: 0, covert: 0, offense: 0, defense: 0, conventional: 0, unconventional: 0 },
    laws: [],
    domains: [],
    crafts: [],
    interests: [],
    affairs: [],
    tasks: [],
    sources: [],
    confidence: { confidence: "MEDIUM", evidenceCount: 3, recencyMinutes: 20 },
    signalBand: "WATCH",
    responseLogic: []
  };
}

describe("vision command piping", () => {
  it("derives recommendations from runtime state instead of static copy", () => {
    const data = baseData();
    data.affairs = [
      {
        id: "a1",
        title: "Unresolved",
        domainId: "d1",
        context: { associatedDomains: ["d1"] },
        means: { craftId: "", selectedHeuristicIds: [] },
        plan: { objectives: [] },
        strategy: { mapping: { allies: [], enemies: [] } },
        entities: []
      }
    ];

    const snapshot = buildVisionCommandSnapshot(data);
    expect(snapshot.signalBand).toBe("WATCH");
    expect(snapshot.unresolvedAffairs).toBe(1);
    expect(snapshot.recommendations.join(" ")).toContain("unresolved affair");
    expect(snapshot.recommendations.join(" ")).toContain("Seed at least one interest");
  });

  it("is deterministic for identical input", () => {
    const data = baseData();
    const first = buildVisionCommandSnapshot(data);
    const second = buildVisionCommandSnapshot(data);
    expect(first).toEqual(second);
  });
});
