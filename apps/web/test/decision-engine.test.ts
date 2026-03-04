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
});
