import { describe, expect, it } from "vitest";
import type { AppData, Affair, Interest, MayaFlowSnapshot } from "../components/war-room-v2/types";
import { buildIntentMirrorSnapshot } from "../lib/war-room/intent-mirror-metrics";
import { mockAppData } from "../lib/war-room/mock-app-data";

function cloneMock(): AppData {
  return JSON.parse(JSON.stringify(mockAppData)) as AppData;
}

function affair(id: string, domainId: string, stakes: number, risk: number): Affair {
  return {
    id,
    title: id,
    domainId,
    status: "in_progress",
    stakes,
    risk,
    context: { associatedDomains: [domainId] },
    means: { craftId: "craft-1", selectedHeuristicIds: [] },
    plan: { objectives: [] },
    strategy: { mapping: { allies: [], enemies: [] } },
    entities: []
  };
}

function interest(id: string, domainId: string, stakes: number, convexity: number): Interest {
  return {
    id,
    title: id,
    domainId,
    stakes,
    convexity,
    status: "in_progress",
    objectives: []
  };
}

function snapshot(convexSharePct: number, caveSharePct: number): MayaFlowSnapshot {
  return {
    sources: [],
    convexSharePct,
    caveSharePct,
    heuristicMeansCoveragePct: 0
  };
}

describe("intent mirror metrics", () => {
  it("always returns a fixed 8-level principal ladder with placeholders", () => {
    const data = cloneMock();
    data.lineages = { nodes: [{ id: "lineage-self", level: "SELF", name: "Self", sortOrder: 1 }], entities: [] };
    data.lineageRisks = [];

    const result = buildIntentMirrorSnapshot(data, snapshot(50, 50));
    expect(result.principalLadder).toHaveLength(8);
    expect(result.principalLadder.find((row) => row.levelKey === "SELF")?.band).toBe("stable");
    expect(result.principalLadder.find((row) => row.levelKey === "FRIENDS")?.band).toBe("unmapped");
    expect(result.principalLadder.find((row) => row.levelKey === "COMMUNITY")?.band).toBe("unmapped");
  });

  it("marks no-ruin as at risk for very high open fragility", () => {
    const data = cloneMock();
    data.lineages = { nodes: [{ id: "lineage-self", level: "SELF", name: "Self", sortOrder: 1 }], entities: [] };
    data.lineageRisks = [
      {
        id: "risk-critical",
        sourceId: "source-nature",
        domainId: "domain-health",
        lineageNodeId: "lineage-self",
        title: "critical",
        exposure: 8,
        dependency: 8,
        irreversibility: 7,
        optionality: 2,
        responseTime: 3,
        fragilityScore: 90,
        status: "OPEN"
      }
    ];

    const result = buildIntentMirrorSnapshot(data, snapshot(55, 45));
    expect(result.noRuinState).toBe("AT_RISK");
    expect(result.directive).toBe("Contain critical lineage fragility first.");
  });

  it("marks no-ruin as at risk for fragile-middle plus cave dominance", () => {
    const data = cloneMock();
    data.lineageRisks = [];
    data.affairs = [affair("affair-1", "domain-health", 5, 5)];
    data.interests = [interest("interest-1", "domain-health", 5, 5)];

    const result = buildIntentMirrorSnapshot(data, snapshot(40, 60));
    expect(result.barbellState).toBe("fragile-middle");
    expect(result.noRuinState).toBe("AT_RISK");
    expect(result.directive).toBe("Polarize barbell: reduce fragile middle.");
  });

  it("stays controlled with convex tilt and no critical pressure", () => {
    const data = cloneMock();
    data.lineageRisks = [];
    data.affairs = [affair("affair-1", "domain-health", 2, 2)];
    data.interests = [interest("interest-1", "domain-health", 8, 9)];

    const result = buildIntentMirrorSnapshot(data, snapshot(70, 30));
    expect(result.noRuinState).toBe("CONTROLLED");
    expect(result.directive).toBe("Scale convex options with capped downside.");
  });
});
