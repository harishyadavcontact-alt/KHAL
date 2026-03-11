import { describe, expect, it } from "vitest";
import { evaluateWarGameMode } from "../components/war-room-v2/war-game-protocol";
import { buildDeterministicTriage, evaluateDecision } from "../lib/decision-spec";
import type { KhalState } from "@khal/domain";
import type { SourceMapProfileDto } from "../components/war-room-v2/types";
import type { WarGameDoctrineChain } from "../lib/war-room/bootstrap";

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

  it("triage returns exact missing items for blocked domain grammar", () => {
    const state: KhalState = {
      domains: [
        {
          id: "d1",
          name: "D1",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ],
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
    const triage = buildDeterministicTriage({ mode: "domain", targetId: "d1", state, role: "MISSIONARY", noRuinGate: true });
    const grammar = triage.find((item) => item.title === "GRAMMAR_INCOMPLETE");
    expect(grammar?.missingItems).toContain("stakes");
    expect(grammar?.missingItems).toContain("risk_map");
  });

  it("flags missing doctrine coverage once source-mode grammar is otherwise complete", () => {
    const now = new Date().toISOString();
    const state: KhalState = {
      domains: [
        {
          id: "d1",
          name: "Finance",
          createdAt: now,
          updatedAt: now
        }
      ],
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
      sources: [
        {
          id: "s1",
          code: "macro-vol",
          name: "Macro Volatility",
          sortOrder: 1,
          domains: [{ id: "sd1", sourceId: "s1", domainId: "d1", dependencyKind: "PRIMARY", pathWeight: 1 }]
        }
      ],
      lineages: { nodes: [], entities: [] },
      lineageRisks: [],
      doctrine: { rulebooks: [], rules: [], domainPnLLadders: [] }
    };
    const sourceMapProfiles: SourceMapProfileDto[] = [
      {
        id: "map-1",
        sourceId: "s1",
        domainId: "d1",
        decisionType: "complex",
        tailClass: "fat",
        quadrant: "Q4",
        methodPosture: "No-ruin first.",
        stakesText: "Capital and strategic freedom.",
        risksText: "Large downside under opacity.",
        fragilityPosture: "Fragile if over-exposed.",
        vulnerabilitiesText: "Leverage and dependency chains.",
        hedgeText: "Raise resilience buffer.",
        edgeText: "Keep small convex optionality.",
        primaryCraftId: "craft-1",
        heuristicsText: "Barbell and optionality.",
        avoidText: "Do not optimize into opacity."
      }
    ];

    const noDoctrine = evaluateDecision({
      mode: "source",
      targetId: "s1",
      state,
      sourceMapProfiles,
      responseLogic: [],
      role: "MISSIONARY",
      noRuinGate: true
    });
    expect(noDoctrine.missingRequiredFields).toContain("doctrine_chain");

    const doctrineChains: WarGameDoctrineChain[] = [
      {
        id: "wg-1",
        craftId: "craft-1",
        craftName: "Antifragility",
        name: "Macro war game",
        scenarios: [
          {
            id: "scn-1",
            wargameId: "wg-1",
            name: "Liquidity shock",
            sortOrder: 1,
            threats: [
              {
                id: "thr-1",
                scenarioId: "scn-1",
                name: "Forced unwind",
                severity: 8,
                responses: [
                  {
                    id: "rsp-1",
                    threatId: "thr-1",
                    name: "Cut leverage"
                  }
                ]
              }
            ]
          }
        ]
      }
    ];

    const withDoctrine = evaluateDecision({
      mode: "source",
      targetId: "s1",
      state,
      sourceMapProfiles,
      responseLogic: doctrineChains,
      role: "MISSIONARY",
      noRuinGate: true
    });
    expect(withDoctrine.missingRequiredFields).not.toContain("doctrine_chain");

    const triage = buildDeterministicTriage({
      mode: "source",
      targetId: "s1",
      state,
      sourceMapProfiles,
      responseLogic: [],
      role: "MISSIONARY",
      noRuinGate: true
    });
    const doctrinePlaybook = triage.find((item) => item.actionKind === "OPEN_SOURCE_DOCTRINE_CHAIN_PLAYBOOK");
    expect(doctrinePlaybook?.missingItems).toContain("doctrine_chain");
  });
});
