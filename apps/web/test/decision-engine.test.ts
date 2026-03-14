import { describe, expect, it } from "vitest";
import type { KhalState } from "@khal/domain";
import { buildDeterministicTriage, buildDraftMutations, evaluateDecision, getDecisionSpec } from "../lib/decision-spec";

function baseState(): KhalState {
  return {
    domains: [],
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
}

describe("decision-spec engine", () => {
  it("exposes canonical spec", () => {
    const spec = getDecisionSpec();
    expect(spec.pipelineStages.length).toBeGreaterThan(0);
    expect(spec.modes.find((m) => m.mode === "craft")).toBeTruthy();
  });

  it("blocks complex monomodal domain without override", () => {
    const state = baseState();
    state.domains.push({
      id: "d1",
      name: "Complex Domain",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      description: "complex nonlinear thick-tail domain"
    });
    state.ends.push({
      id: "e1",
      domainId: "d1",
      title: "Hedge posture only",
      priority: 1,
      status: "NOT_STARTED"
    });
    const result = evaluateDecision({ mode: "domain", targetId: "d1", state, noRuinGate: true, role: "MISSIONARY" });
    expect(result.blocked).toBe(true);
    expect(result.blockReasons.some((r) => r.code === "COMPLEX_MONOMODAL_BLOCK")).toBe(true);
  });

  it("allows complex monomodal domain with explicit guard override", () => {
    const state = baseState();
    state.domains.push({
      id: "d1",
      name: "Complex Domain",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      description: "complex nonlinear thick-tail domain"
    });
    state.ends.push({
      id: "e1",
      domainId: "d1",
      title: "Hedge posture only",
      priority: 1,
      status: "NOT_STARTED"
    });
    const result = evaluateDecision({
      mode: "domain",
      targetId: "d1",
      state,
      noRuinGate: true,
      role: "MISSIONARY",
      overrides: ["G1_COMPLEX_MONOMODAL"]
    });
    expect(result.blockReasons.some((r) => r.code === "COMPLEX_MONOMODAL_BLOCK")).toBe(false);
  });

  it("blocks no-ruin gate failure", () => {
    const state = baseState();
    const result = evaluateDecision({ mode: "source", targetId: "global", state, noRuinGate: false, role: "VISIONARY" });
    expect(result.blocked).toBe(true);
    expect(result.blockReasons.some((r) => r.code === "NO_RUIN_GATE_FAILED")).toBe(true);
  });

  it("creates dry-run mutations without committing state", () => {
    const state = baseState();
    state.domains.push({
      id: "d1",
      name: "General Domain",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    const mutations = buildDraftMutations({
      mode: "interest",
      targetId: "d1",
      prompt: "war game this interest and queue next task",
      state
    });
    expect(mutations.some((m) => m.kind === "CREATE_INTEREST")).toBe(true);
    expect(mutations.some((m) => m.kind === "CREATE_TASK")).toBe(true);
    expect(state.interests.length).toBe(0);
    expect(state.tasks.length).toBe(0);
  });

  it("builds deterministic triage suggestions from block reasons", () => {
    const state = baseState();
    state.domains.push({
      id: "d1",
      name: "Complex Domain",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      description: "complex nonlinear thick-tail domain"
    });
    const first = buildDeterministicTriage({ mode: "domain", targetId: "d1", state, role: "MISSIONARY", noRuinGate: true });
    const second = buildDeterministicTriage({ mode: "domain", targetId: "d1", state, role: "MISSIONARY", noRuinGate: true });
    expect(first).toEqual(second);
    expect(first.some((item) => item.actionKind === "SET_DOMAIN_BIMODAL_POSTURE_TEMPLATE")).toBe(true);
  });

  it("blocks source posture when the map is too weak for lineage exposure", () => {
    const now = new Date().toISOString();
    const state = baseState();
    state.domains.push({
      id: "d1",
      name: "Energy",
      createdAt: now,
      updatedAt: now
    });
    state.sources!.push({
      id: "s1",
      code: "energy-grid",
      name: "Grid fragility",
      sortOrder: 1,
      domains: [{ id: "link-1", sourceId: "s1", domainId: "d1", dependencyKind: "PRIMARY", pathWeight: 1 }]
    } as never);
    state.lineages = {
      nodes: [{ id: "ln-humanity", level: "HUMANITY", name: "Humanity", sortOrder: 5 }],
      entities: []
    };
    state.lineageRisks!.push({
      id: "lr1",
      sourceId: "s1",
      domainId: "d1",
      lineageNodeId: "ln-humanity",
      title: "Grid collapse cascades into civilization risk",
      exposure: 9,
      dependency: 8,
      irreversibility: 8,
      optionality: 1,
      responseTime: 2,
      fragilityScore: 88,
      status: "OPEN"
    });

    const result = evaluateDecision({
      mode: "source",
      targetId: "s1",
      state,
      noRuinGate: true,
      role: "MISSIONARY",
      sourceMapProfiles: [{
        id: "smp-1",
        sourceId: "s1",
        domainId: "d1",
        decisionType: "simple",
        tailClass: "thin",
        quadrant: "Q1",
        methodPosture: "Use structured analysis, base rates, and explicit measurement. Statistical tools are admissible.",
        stakesText: "Civil continuity and energy access.",
        risksText: "Grid failure can propagate into essential services.",
        lineageThreatText: "Humanity-level continuity is exposed.",
        fragilityPosture: "Short volatility due to tight coupling.",
        vulnerabilitiesText: "Single-point failures and slow recovery paths.",
        hedgeText: "Build redundancy and reserve capacity.",
        edgeText: "Keep small optional energy experiments alive.",
        primaryCraftId: "craft-grid",
        heuristicsText: "Prefer redundancy over precision.",
        avoidText: "Avoid brittle optimization."
      }]
    });
    expect(result.stateOfArt?.stages.find((stage) => stage.id === "map")?.complete).toBe(false);
    expect(result.stateOfArt?.recommendedPosture).toContain("Precaution first");
    expect(result.blockReasons.some((reason) => reason.code === "STATE_OF_ART_POSTURE_MISMATCH")).toBe(true);
  });

  it("tightens affair readiness when higher-lineage exposure is unhedged", () => {
    const now = new Date().toISOString();
    const state = baseState();
    state.domains.push({
      id: "d1",
      name: "Critical Domain",
      createdAt: now,
      updatedAt: now
    });
    state.affairs.push({
      id: "a1",
      domainId: "d1",
      title: "Protect grid resilience",
      stakes: 8,
      risk: 8,
      status: "NOT_STARTED",
      completionPct: 0,
      context: { associatedDomains: ["d1"] },
      means: { craftId: "c1", selectedHeuristicIds: [] },
      strategy: { mapping: { allies: [], enemies: [] } }
    });
    state.lineages = {
      nodes: [{ id: "ln-humanity", level: "HUMANITY", name: "Humanity", sortOrder: 5 }],
      entities: []
    };
    state.lineageRisks!.push({
      id: "lr1",
      sourceId: "s1",
      domainId: "d1",
      lineageNodeId: "ln-humanity",
      title: "Humanity-scale system rupture",
      exposure: 9,
      dependency: 9,
      irreversibility: 9,
      optionality: 2,
      responseTime: 2,
      fragilityScore: 90,
      status: "OPEN"
    });

    const result = evaluateDecision({ mode: "affair", targetId: "a1", state, noRuinGate: true, role: "MISSIONARY" });
    expect(result.lineagePressure?.maxLevel).toBe("HUMANITY");
    expect(result.lineagePressure?.policyBand).toBe("CIVILIZATIONAL");
    expect(result.lineagePressure?.requiredPosture).toBe("HEDGE");
    expect(result.lineagePressure?.stakeSignal).toBeGreaterThan(0);
    expect(result.lineagePressure?.riskSignal).toBeGreaterThan(0);
    expect(result.blockReasons.some((reason) => reason.code === "LINEAGE_HEDGE_REQUIRED")).toBe(true);
  });

  it("blocks option execution when lineage exposure is high and downside is undefined", () => {
    const now = new Date().toISOString();
    const state = baseState();
    state.domains.push({
      id: "d1",
      name: "Critical Domain",
      createdAt: now,
      updatedAt: now
    });
    state.interests.push({
      id: "i1",
      domainId: "d1",
      title: "Speculative edge",
      stakes: 7,
      risk: 7,
      convexity: 8,
      status: "NOT_STARTED",
      labStage: "WIELD",
      hypothesis: "There is upside."
    });
    state.lineages = {
      nodes: [{ id: "ln-state", level: "STATE", name: "State", sortOrder: 3 }],
      entities: []
    };
    state.lineageRisks!.push({
      id: "lr1",
      sourceId: "s1",
      domainId: "d1",
      lineageNodeId: "ln-state",
      title: "State-level institutional failure",
      exposure: 8,
      dependency: 7,
      irreversibility: 8,
      optionality: 3,
      responseTime: 3,
      fragilityScore: 80,
      status: "OPEN"
    });

    const result = evaluateDecision({ mode: "interest", targetId: "i1", state, noRuinGate: true, role: "MISSIONARY" });
    expect(result.lineagePressure?.hedgeRequired).toBe(true);
    expect(result.lineagePressure?.requiredPosture).toBe("HEDGE");
    expect(result.blockReasons.some((reason) => reason.code === "LINEAGE_OPTIONALITY_UNHEDGED")).toBe(true);
  });

  it("escalates to no-ruin posture when lineage exposure is existential", () => {
    const now = new Date().toISOString();
    const state = baseState();
    state.domains.push({
      id: "d1",
      name: "Biosphere Domain",
      createdAt: now,
      updatedAt: now
    });
    state.affairs.push({
      id: "a1",
      domainId: "d1",
      title: "Protect biosphere integrity",
      stakes: 10,
      risk: 9,
      status: "NOT_STARTED",
      completionPct: 0,
      context: { associatedDomains: ["d1"] },
      means: { craftId: "c1", selectedHeuristicIds: [] },
      strategy: { mapping: { allies: [], enemies: [] } }
    });
    state.lineages = {
      nodes: [{ id: "ln-nature", level: "NATURE", name: "Nature", sortOrder: 6 }],
      entities: []
    };
    state.lineageRisks!.push({
      id: "lr1",
      sourceId: "s1",
      domainId: "d1",
      lineageNodeId: "ln-nature",
      title: "Irreversible ecological collapse",
      exposure: 10,
      dependency: 10,
      irreversibility: 10,
      optionality: 1,
      responseTime: 1,
      fragilityScore: 95,
      status: "OPEN"
    });

    const result = evaluateDecision({ mode: "affair", targetId: "a1", state, noRuinGate: true, role: "MISSIONARY" });
    expect(result.lineagePressure?.policyBand).toBe("EXISTENTIAL");
    expect(result.lineagePressure?.requiredPosture).toBe("NO_RUIN");
    expect(result.lineagePressure?.hedgeRequired).toBe(true);
  });
});
