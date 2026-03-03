import { describe, expect, it } from "vitest";
import type { Affair, AppData, Interest, Task } from "../components/war-room-v2/types";
import {
  buildDoNowItems,
  computeAsymmetrySnapshot,
  computeBarbellGuardrail,
  computeStakeTriad
} from "../lib/war-room/operational-metrics";

function makeBaseData(): AppData {
  return {
    user: { birthDate: "2000-01-01T00:00:00.000Z", lifeExpectancy: 80, name: "Operator", location: "Local" },
    strategyMatrix: { allies: 0, enemies: 0, overt: 0, covert: 0, offense: 0, defense: 0, conventional: 0, unconventional: 0 },
    laws: [],
    domains: [{ id: "domain-1", name: "Domain 1", fragilityText: "critical fragility" }],
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

function makeAffair(id: string, domainId: string, stakes: number, risk: number, status = "in_progress"): Affair {
  return {
    id,
    title: id,
    domainId,
    status,
    stakes,
    risk,
    perspective: "macro",
    context: { associatedDomains: [domainId] },
    means: { craftId: "craft-1", selectedHeuristicIds: [] },
    plan: { objectives: [] },
    strategy: { mapping: { allies: [], enemies: [] } },
    entities: []
  };
}

function makeInterest(id: string, domainId: string, stakes: number, convexity: number, status = "in_progress"): Interest {
  return {
    id,
    title: id,
    domainId,
    stakes,
    convexity,
    risk: 5,
    status,
    objectives: []
  };
}

function makeTask(id: string, domainId: string, horizon: Task["horizon"], dueDate?: string): Task {
  return {
    id,
    title: id,
    domainId,
    sourceType: "AFFAIR",
    sourceId: "affair-1",
    dependencyIds: [],
    horizon,
    priority: 50,
    status: "not_started",
    dueDate
  };
}

describe("operational metrics", () => {
  it("returns deterministic Do-Now ordering and explanations", () => {
    const data = makeBaseData();
    data.affairs = [makeAffair("affair-high-fragility", "domain-1", 9, 9)];
    data.interests = [makeInterest("interest-convex", "domain-1", 10, 10)];
    data.tasks = [makeTask("task-week", "domain-1", "WEEK")];

    const first = buildDoNowItems(data, 5);
    const second = buildDoNowItems(
      {
        ...data,
        affairs: [...data.affairs],
        interests: [...data.interests],
        tasks: [...data.tasks]
      },
      5
    );

    expect(first).toEqual(second);
    expect(first[0]?.title).toBe("interest-convex");
    expect(first[0]?.why).toContain("Convex payoff score");
  });

  it("keeps stake triad stable with empty risks and tasks via fallback", () => {
    const data = makeBaseData();
    const triad = computeStakeTriad(data);

    expect(triad.lifeScore).toBeGreaterThan(0);
    expect(triad.timeScore).toBe(0);
    expect(triad.soulScore).toBe(0);
    expect(triad.openLineageRiskCount).toBe(0);
  });

  it("classifies barbell guardrail thresholds", () => {
    const edgeHeavy = makeBaseData();
    edgeHeavy.affairs = [makeAffair("affair-1", "domain-1", 2, 2)];
    edgeHeavy.interests = [makeInterest("interest-1", "domain-1", 10, 10)];
    expect(computeBarbellGuardrail(edgeHeavy).status).toBe("edge-heavy");

    const hedgeHeavy = makeBaseData();
    hedgeHeavy.affairs = [makeAffair("affair-1", "domain-1", 10, 9)];
    hedgeHeavy.interests = [makeInterest("interest-1", "domain-1", 2, 2)];
    expect(computeBarbellGuardrail(hedgeHeavy).status).toBe("hedge-heavy");

    const middle = makeBaseData();
    middle.affairs = [makeAffair("affair-1", "domain-1", 8, 8)];
    middle.interests = [makeInterest("interest-1", "domain-1", 8, 8)];
    const middleResult = computeBarbellGuardrail(middle);
    expect(middleResult.fragileMiddle).toBe(true);
    expect(middleResult.status).toBe("fragile-middle");
  });

  it("changes asymmetry band with convexity and fragility shifts", () => {
    const edgeHeavy = makeBaseData();
    edgeHeavy.affairs = [makeAffair("affair-1", "domain-1", 1, 1)];
    edgeHeavy.interests = [makeInterest("interest-1", "domain-1", 10, 10)];
    expect(computeAsymmetrySnapshot(edgeHeavy).band).toBe("antifragile");

    const hedgeHeavy = makeBaseData();
    hedgeHeavy.affairs = [makeAffair("affair-1", "domain-1", 10, 10)];
    hedgeHeavy.interests = [makeInterest("interest-1", "domain-1", 1, 1)];
    expect(computeAsymmetrySnapshot(hedgeHeavy).band).toBe("fragile");

    const neutral = makeBaseData();
    neutral.affairs = [makeAffair("affair-1", "domain-1", 7, 7)];
    neutral.interests = [makeInterest("interest-1", "domain-1", 7, 7)];
    expect(computeAsymmetrySnapshot(neutral).band).toBe("neutral");
  });
});
