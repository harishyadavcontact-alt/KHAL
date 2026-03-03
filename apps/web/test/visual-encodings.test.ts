import { describe, expect, it } from "vitest";
import type { AppData } from "../components/war-room-v2/types";
import { buildDomainVisualSnapshot, buildMissionVisualSnapshot, buildWarGamingVisualSnapshot } from "../lib/war-room/visual-encodings";

function baseData(): AppData {
  return {
    user: { name: "Operator", birthDate: "2000-01-01T00:00:00.000Z", lifeExpectancy: 80, location: "Local" },
    strategyMatrix: { allies: 0, enemies: 0, overt: 0, covert: 0, offense: 0, defense: 0, conventional: 0, unconventional: 0 },
    laws: [],
    domains: [],
    crafts: [],
    interests: [],
    affairs: [],
    tasks: [],
    sources: [],
    missionGraph: { nodes: [], dependencies: [] },
    lineages: { nodes: [], entities: [] },
    lineageRisks: [],
    doctrine: { rulebooks: [], rules: [], domainPnLLadders: [] }
  };
}

describe("visual encodings", () => {
  it("builds deterministic mission snapshot with stable ordering", () => {
    const data = baseData();
    data.domains = [{ id: "domain-1", name: "Domain 1" }];
    data.affairs = [
      {
        id: "affair-1",
        title: "Affair 1",
        domainId: "domain-1",
        status: "in_progress",
        stakes: 8,
        risk: 7,
        context: { associatedDomains: ["domain-1"] },
        means: { craftId: "craft-1", selectedHeuristicIds: [] },
        plan: { objectives: ["obj"] },
        strategy: { mapping: { allies: [], enemies: [] } },
        entities: []
      }
    ];
    data.interests = [
      {
        id: "interest-1",
        title: "Interest 1",
        domainId: "domain-1",
        stakes: 7,
        convexity: 8,
        status: "in_progress",
        objectives: []
      }
    ];
    data.lineageRisks = [
      {
        id: "risk-1",
        sourceId: "source-1",
        domainId: "domain-1",
        lineageNodeId: "lineage-self",
        title: "Critical Risk",
        exposure: 8,
        dependency: 8,
        irreversibility: 7,
        optionality: 3,
        responseTime: 3,
        fragilityScore: 92,
        status: "OPEN"
      }
    ];

    const first = buildMissionVisualSnapshot(data);
    const second = buildMissionVisualSnapshot({
      ...data,
      affairs: [...data.affairs],
      interests: [...data.interests],
      lineageRisks: [...(data.lineageRisks ?? [])]
    });

    expect(first).toEqual(second);
    expect(first.rows[0]?.title).toBe("Critical Risk");
    expect(first.rows[0]?.flowWeight).toBe(63);
  });

  it("builds war-gaming flow and quadrants with deterministic shares", () => {
    const data = baseData();
    data.domains = [
      { id: "domain-cave", name: "Domain Cave", volatilitySourceId: "source-cave", heuristics: "h" },
      { id: "domain-convex", name: "Domain Convex", volatilitySourceId: "source-convex", heuristics: "h" }
    ];
    data.sources = [
      {
        id: "source-cave",
        code: "CAVE",
        name: "Source Cave",
        sortOrder: 1,
        domainCount: 1,
        domains: [{ id: "link-cave", sourceId: "source-cave", domainId: "domain-cave", dependencyKind: "PRIMARY", pathWeight: 1 }]
      },
      {
        id: "source-convex",
        code: "CNVX",
        name: "Source Convex",
        sortOrder: 2,
        domainCount: 1,
        domains: [{ id: "link-convex", sourceId: "source-convex", domainId: "domain-convex", dependencyKind: "PRIMARY", pathWeight: 1 }]
      }
    ];
    data.affairs = [
      {
        id: "affair-cave",
        title: "Affair Cave",
        domainId: "domain-cave",
        status: "in_progress",
        stakes: 9,
        risk: 9,
        context: { associatedDomains: ["domain-cave"] },
        means: { craftId: "craft-1", selectedHeuristicIds: [] },
        plan: { objectives: [] },
        strategy: { mapping: { allies: [], enemies: [] } },
        entities: []
      }
    ];
    data.interests = [
      {
        id: "interest-convex",
        title: "Interest Convex",
        domainId: "domain-convex",
        stakes: 10,
        convexity: 10,
        status: "in_progress",
        objectives: []
      }
    ];
    data.tasks = [
      {
        id: "task-cave",
        title: "Task Cave",
        domainId: "domain-cave",
        sourceType: "AFFAIR",
        sourceId: "affair-cave",
        dependencyIds: [],
        horizon: "WEEK",
        dueDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        priority: 55,
        status: "not_started"
      }
    ];
    data.lineageRisks = [
      {
        id: "risk-cave",
        sourceId: "source-cave",
        domainId: "domain-cave",
        lineageNodeId: "lineage-self",
        title: "Cave pressure",
        exposure: 8,
        dependency: 8,
        irreversibility: 8,
        optionality: 2,
        responseTime: 4,
        fragilityScore: 93,
        status: "OPEN"
      }
    ];

    const snapshot = buildWarGamingVisualSnapshot(data);
    expect(snapshot.sourceLinks.length).toBe(2);
    expect(snapshot.sourceLinks.some((link) => link.laneId === "CAVE")).toBe(true);
    expect(snapshot.sourceLinks.some((link) => link.laneId === "CONVEX")).toBe(true);
    expect(snapshot.quadrantCells).toHaveLength(4);
  });

  it("returns neutral-safe domain snapshot on sparse data", () => {
    const data = baseData();
    data.domains = [{ id: "domain-1", name: "Domain 1" }];

    const snapshot = buildDomainVisualSnapshot({ domainId: "domain-1", data });
    expect(snapshot.posture).toHaveLength(3);
    expect(snapshot.meansCoveragePct).toBe(0);
    expect(snapshot.barbellSegments.map((segment) => segment.value)).toEqual([0, 0]);
    expect(snapshot.riskCells).toEqual([]);
  });
});
