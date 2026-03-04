import { describe, expect, it } from "vitest";
import type { Affair, AppData, Interest, LineageRiskDto, Task } from "../components/war-room-v2/types";
import {
  buildDoNowItems,
  computeAsymmetrySnapshot,
  computeBarbellGuardrail,
  computeExecutionSplit,
  computeFragilistaWatchlist,
  computeHarmSignalSnapshot,
  computeInterestAsymmetryScore,
  computeInterestProtocolChecks,
  computeLabSummary,
  computeStakeTriad,
  withLabDerivedFields
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

function makeLineageRisk(id: string, domainId: string, sourceId: string, overrides?: Partial<LineageRiskDto>): LineageRiskDto {
  return {
    id,
    sourceId,
    domainId,
    lineageNodeId: "self",
    actorType: "public",
    title: id,
    exposure: 8,
    dependency: 8,
    irreversibility: 7,
    optionality: 2,
    responseTime: 20,
    fragilityScore: 82,
    status: "OPEN",
    notes: "",
    ...overrides
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

  it("builds deterministic harm snapshot and bounds metrics", () => {
    const data = makeBaseData();
    data.lineageRisks = [
      makeLineageRisk("risk-1", "domain-1", "source-1", { fragilityScore: 80 }),
      makeLineageRisk("risk-2", "domain-1", "source-1", { fragilityScore: 60, status: "MITIGATING" })
    ];
    data.tasks = [makeTask("task-1", "domain-1", "WEEK", "2001-01-01T00:00:00.000Z")];

    const first = computeHarmSignalSnapshot(data);
    const second = computeHarmSignalSnapshot({
      ...data,
      lineageRisks: [...(data.lineageRisks ?? [])],
      tasks: [...data.tasks]
    });

    expect(first).toEqual(second);
    expect(first.harmLevel).toBeGreaterThanOrEqual(0);
    expect(first.harmLevel).toBeLessThanOrEqual(100);
    expect(first.disorderPressure).toBeGreaterThanOrEqual(0);
    expect(first.disorderPressure).toBeLessThanOrEqual(100);
  });

  it("ranks fragilista watchlist by accountability pressure", () => {
    const data = makeBaseData();
    data.sources = [{ id: "source-1", code: "S1", name: "Source 1", sortOrder: 1, domainCount: 1, domains: [] }];
    data.lineageRisks = [
      makeLineageRisk("risk-low-sitg", "domain-1", "source-1", {
        title: "Low SITG",
        exposure: 10,
        dependency: 10,
        irreversibility: 10,
        optionality: 1,
        responseTime: 30
      }),
      makeLineageRisk("risk-high-sitg", "domain-1", "source-1", {
        title: "High SITG",
        exposure: 3,
        dependency: 2,
        irreversibility: 2,
        optionality: 9,
        responseTime: 2
      })
    ];

    const items = computeFragilistaWatchlist(data, 5);
    expect(items[0]?.title).toBe("Low SITG");
    expect(items[0]?.sitgBand).toBe("LOW");
  });

  it("flags execution split imbalance when one lane dominates", () => {
    const data = makeBaseData();
    data.affairs = [makeAffair("affair-1", "domain-1", 10, 10, "in_progress")];
    data.interests = [makeInterest("interest-1", "domain-1", 10, 10, "done")];
    data.tasks = [makeTask("task-interest", "domain-1", "WEEK"), makeTask("task-interest-2", "domain-1", "WEEK")].map((task) => ({
      ...task,
      sourceType: "INTEREST",
      status: "done"
    }));

    const split = computeExecutionSplit(data);
    expect(["interests-heavy", "fragile-middle"]).toContain(split.imbalanceBand);
  });

  it("computes deterministic asymmetry score and protocol checks for lab interests", () => {
    const interest = makeInterest("interest-lab", "domain-1", 8, 9, "in_progress");
    interest.hypothesis = "Convex tinkering compounds over iterations";
    interest.maxLossPct = 15;
    interest.expiryDate = "2099-01-01T00:00:00.000Z";
    interest.killCriteria = ["No measurable edge by review date"];
    interest.hedgePct = 80;
    interest.edgePct = 20;
    interest.irreversibility = 25;

    const scoreA = computeInterestAsymmetryScore(interest);
    const scoreB = computeInterestAsymmetryScore({ ...interest });
    expect(scoreA).toBe(scoreB);
    expect(scoreA).toBeGreaterThan(0);
    expect(scoreA).toBeLessThanOrEqual(100);

    const checks = computeInterestProtocolChecks(interest, { id: "domain-1", name: "D1", stakesText: "high stakes", risksText: "critical" });
    expect(checks.every((check) => check.passed)).toBe(true);
  });

  it("marks protocol readiness false when lab checklist is incomplete", () => {
    const data = makeBaseData();
    data.interests = [
      {
        ...makeInterest("interest-bad", "domain-1", 8, 8),
        labStage: "WIELD",
        hypothesis: "",
        maxLossPct: 0,
        expiryDate: "2000-01-01T00:00:00.000Z",
        killCriteria: [],
        hedgePct: 40,
        edgePct: 40
      }
    ];

    const derived = withLabDerivedFields(data);
    expect(derived.interests[0]?.protocolReady).toBe(false);
    const summary = computeLabSummary(derived);
    expect(summary.blockedExperiments).toBe(1);
  });
});
