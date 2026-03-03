import { describe, expect, it } from "vitest";
import type { AppData, Affair, Interest, Task, VolatilitySourceDto } from "../components/war-room-v2/types";
import { buildMayaFlowSnapshot } from "../lib/war-room/maya-metrics";
import { buildIntentMirrorSnapshot } from "../lib/war-room/intent-mirror-metrics";
import { mockAppData } from "../lib/war-room/mock-app-data";

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

function affair(id: string, domainId: string, stakes: number, risk: number, status = "in_progress"): Affair {
  return {
    id,
    title: id,
    domainId,
    status,
    stakes,
    risk,
    context: { associatedDomains: [domainId] },
    means: { craftId: "craft-1", selectedHeuristicIds: [] },
    plan: { objectives: [] },
    strategy: { mapping: { allies: [], enemies: [] } },
    entities: []
  };
}

function interest(id: string, domainId: string, stakes: number, convexity: number, status = "in_progress"): Interest {
  return {
    id,
    title: id,
    domainId,
    stakes,
    convexity,
    status,
    objectives: []
  };
}

function task(id: string, domainId: string, dueDate?: string, status = "not_started"): Task {
  return {
    id,
    title: id,
    domainId,
    sourceType: "AFFAIR",
    sourceId: "affair-1",
    dependencyIds: [],
    horizon: "WEEK",
    dueDate,
    priority: 50,
    status
  };
}

function source(id: string, name: string, domainIds: string[] = []): VolatilitySourceDto {
  return {
    id,
    code: id.toUpperCase(),
    name,
    sortOrder: 1,
    domainCount: domainIds.length,
    domains: domainIds.map((domainId, index) => ({
      id: `${id}-link-${index}`,
      sourceId: id,
      domainId,
      dependencyKind: "PRIMARY",
      pathWeight: 1
    }))
  };
}

describe("maya metrics", () => {
  it("is deterministic for identical snapshots", () => {
    const data = baseData();
    data.domains = [{ id: "domain-1", name: "Domain 1", volatilitySourceId: "source-1", heuristics: "Keep optionality" }];
    data.sources = [source("source-1", "Source 1", ["domain-1"])];
    data.affairs = [affair("affair-1", "domain-1", 8, 8)];
    data.interests = [interest("interest-1", "domain-1", 7, 7)];

    const first = buildMayaFlowSnapshot(data);
    const second = buildMayaFlowSnapshot({
      ...data,
      domains: [...data.domains],
      sources: [...(data.sources ?? [])],
      affairs: [...data.affairs],
      interests: [...data.interests]
    });

    expect(first).toEqual(second);
  });

  it("maps source domains via fallback when direct links are missing", () => {
    const data = baseData();
    data.domains = [
      { id: "domain-id-fallback", name: "ID fallback", volatilitySourceId: "source-a", heuristics: "h" },
      { id: "domain-name-fallback", name: "Name fallback", volatilitySourceName: "Law of Time", heuristics: "h" }
    ];
    data.sources = [source("source-a", "Source A"), source("source-time", "Law of Time")];

    const snapshot = buildMayaFlowSnapshot(data);
    const a = snapshot.sources.find((entry) => entry.sourceId === "source-a");
    const time = snapshot.sources.find((entry) => entry.sourceId === "source-time");

    expect(a?.domainIds).toContain("domain-id-fallback");
    expect(time?.domainIds).toContain("domain-name-fallback");
  });

  it("is safe on empty input", () => {
    const snapshot = buildMayaFlowSnapshot(baseData());
    expect(snapshot.sources).toEqual([]);
    expect(snapshot.convexSharePct).toBe(0);
    expect(snapshot.caveSharePct).toBe(0);
    expect(snapshot.heuristicMeansCoveragePct).toBe(0);
  });

  it("classifies cave vs convex lanes based on signals", () => {
    const now = Date.now();
    const data = baseData();
    data.domains = [
      { id: "domain-cave", name: "Cave Domain", volatilitySourceId: "source-cave", heuristics: "h" },
      { id: "domain-convex", name: "Convex Domain", volatilitySourceId: "source-convex", heuristics: "h" }
    ];
    data.sources = [source("source-cave", "Source Cave", ["domain-cave"]), source("source-convex", "Source Convex", ["domain-convex"])];
    data.affairs = [affair("affair-cave", "domain-cave", 9, 9)];
    data.interests = [interest("interest-convex", "domain-convex", 10, 10)];
    data.tasks = [task("task-cave", "domain-cave", new Date(now - 2 * 24 * 60 * 60 * 1000).toISOString())];
    data.lineageRisks = [
      {
        id: "risk-cave",
        sourceId: "source-cave",
        domainId: "domain-cave",
        lineageNodeId: "lineage-self",
        title: "Cave risk",
        exposure: 8,
        dependency: 8,
        irreversibility: 7,
        optionality: 2,
        responseTime: 3,
        fragilityScore: 92,
        status: "OPEN"
      }
    ];

    const snapshot = buildMayaFlowSnapshot(data);
    const cave = snapshot.sources.find((entry) => entry.sourceId === "source-cave");
    const convex = snapshot.sources.find((entry) => entry.sourceId === "source-convex");

    expect(cave?.lane).toBe("CAVE");
    expect(convex?.lane).toBe("CONVEX");
  });

  it("keeps weighted global split consistent", () => {
    const now = Date.now();
    const data = baseData();
    data.domains = [
      { id: "domain-1", name: "Domain 1", volatilitySourceId: "source-1", heuristics: "h" },
      { id: "domain-2", name: "Domain 2", volatilitySourceId: "source-2", heuristics: "" }
    ];
    data.sources = [source("source-1", "Source 1", ["domain-1"]), source("source-2", "Source 2", ["domain-2"])];
    data.affairs = [affair("affair-1", "domain-1", 10, 10), affair("affair-2", "domain-2", 2, 2)];
    data.interests = [interest("interest-2", "domain-2", 10, 10)];
    data.tasks = [task("task-1", "domain-1", new Date(now - 24 * 60 * 60 * 1000).toISOString())];
    data.lineageRisks = [
      {
        id: "risk-1",
        sourceId: "source-1",
        domainId: "domain-1",
        lineageNodeId: "lineage-self",
        title: "risk",
        exposure: 8,
        dependency: 8,
        irreversibility: 7,
        optionality: 2,
        responseTime: 3,
        fragilityScore: 95,
        status: "OPEN"
      }
    ];

    const snapshot = buildMayaFlowSnapshot(data);
    expect(snapshot.convexSharePct + snapshot.caveSharePct).toBe(100);
  });

  it("produces meaningful flow from frontend-only mock data", () => {
    const snapshot = buildMayaFlowSnapshot(mockAppData);
    expect(snapshot.sources.length).toBeGreaterThan(0);
    expect(snapshot.heuristicMeansCoveragePct).toBeGreaterThanOrEqual(0);
    expect(snapshot.convexSharePct + snapshot.caveSharePct).toBe(100);
  });

  it("integrates with intent mirror snapshot deterministically", () => {
    const flow = buildMayaFlowSnapshot(mockAppData);
    const intent = buildIntentMirrorSnapshot(mockAppData, flow);

    expect(intent.condition).toBe("Causal Opacity: Active");
    expect(intent.signal).toBe("Harm");
    expect(intent.principalLadder).toHaveLength(8);
    expect(intent.convexSharePct + intent.caveSharePct).toBe(100);
  });
});
