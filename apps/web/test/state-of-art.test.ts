import { describe, expect, it } from "vitest";
import { buildSourceWarGameProtocol, buildStateOfArtProjection, affairProjectionDrift, interestProjectionDrift } from "../lib/war-room/state-of-art";
import type { Affair, Craft, Domain, Interest, LineageNodeDto, LineageRiskDto, SourceMapProfileDto, VolatilitySourceDto } from "../components/war-room-v2/types";

describe("state of the art projection", () => {
  const domain: Domain = { id: "dom-1", name: "Finance" };
  const source: VolatilitySourceDto = { id: "src-1", code: "macro", name: "Macro Volatility", sortOrder: 1, domainCount: 1 };
  const craft: Pick<Craft, "id" | "name"> = { id: "craft-a", name: "Bellwether" };
  const profile: SourceMapProfileDto = {
    id: "profile-1",
    sourceId: "src-1",
    domainId: "dom-1",
    decisionType: "complex",
    tailClass: "fat",
    quadrant: "Q4",
    methodPosture: "No-ruin first.",
    stakesText: "Capital survival.",
    risksText: "Liquidity shock.",
    playersText: "Fragilistas",
    lineageThreatText: "Family and state",
    fragilityPosture: "fragile",
    vulnerabilitiesText: "Leverage",
    hedgeText: "Hold cash.",
    edgeText: "Keep convex bets alive.",
    primaryCraftId: "craft-a",
    heuristicsText: "Prefer optionality.",
    avoidText: "Avoid leverage.",
    affairId: "aff-1",
    interestId: "int-1"
  };

  it("builds a readable projection from the source-map profile", () => {
    const projection = buildStateOfArtProjection({ profile, source, domain, crafts: [craft] });
    expect(projection.stone.asymmetry.skinInTheGame.stakes).toBe("Capital survival.");
    expect(projection.stone.nonLinearity.shortVolatilityLabel).toBe("Short volatility");
    expect(projection.means.primaryCraftName).toBe("Bellwether");
    expect(projection.links.affairId).toBe("aff-1");
  });

  it("flags affair drift when the live record no longer matches the source-backed posture", () => {
    const projection = buildStateOfArtProjection({ profile, source, domain, crafts: [craft] });
    const affair: Affair = {
      id: "aff-1",
      title: "Treasury hedge",
      domainId: "dom-1",
      means: { craftId: "craft-b", selectedHeuristicIds: [] },
      plan: { objectives: ["Something else entirely"] },
      context: { associatedDomains: ["dom-1"] },
      strategy: { mapping: { allies: [], enemies: [] } },
      entities: []
    };
    const drift = affairProjectionDrift({ affair, projection });
    expect(drift.some((item) => item.id === "affair-craft" && item.status === "drifted")).toBe(true);
    expect(drift.some((item) => item.id === "affair-hedge" && item.status === "missing")).toBe(true);
  });

  it("flags interest drift when the live option no longer reflects edge/downside guidance", () => {
    const projection = buildStateOfArtProjection({ profile, source, domain, crafts: [craft] });
    const interest: Interest = {
      id: "int-1",
      title: "Convex allocation",
      domainId: "dom-1",
      hypothesis: "Different thesis",
      downside: "Undefined downside",
      evidenceNote: "Other evidence"
    };
    const drift = interestProjectionDrift({ interest, projection });
    expect(drift.some((item) => item.id === "interest-hypothesis" && item.status === "drifted")).toBe(true);
    expect(drift.some((item) => item.id === "interest-downside" && item.status === "drifted")).toBe(true);
  });

  it("builds a source-mode protocol so Map/Stone/Ends/Means are backend-defined instead of UI-only", () => {
    const sourceWithProfile: VolatilitySourceDto = {
      ...source,
      domainCount: 1,
      domains: [{ id: "link-1", sourceId: "src-1", domainId: "dom-1", dependencyKind: "PRIMARY", pathWeight: 1 }],
      mapProfiles: [profile]
    };
    const lineages: LineageNodeDto[] = [{ id: "ln-family", level: "FAMILY", name: "Family", sortOrder: 1 }];
    const lineageRisks: LineageRiskDto[] = [{
      id: "risk-1",
      sourceId: "src-1",
      domainId: "dom-1",
      lineageNodeId: "ln-family",
      title: "Family capital drawdown",
      exposure: 8,
      dependency: 7,
      irreversibility: 6,
      optionality: 3,
      responseTime: 5,
      fragilityScore: 56,
      status: "OPEN"
    }];
    const protocol = buildSourceWarGameProtocol({
      sourceId: "src-1",
      sources: [sourceWithProfile],
      domains: [domain],
      lineages,
      lineageRisks,
      crafts: [craft],
      responseLogic: [{
        id: "chain-1",
        craftId: "craft-a",
        craftName: "Bellwether",
        name: "Bellwether chain",
        objective: "Pressure-test tails",
        scenarios: [{
          id: "sc-1",
          wargameId: "chain-1",
          name: "Liquidity snap",
          threats: [{
            id: "th-1",
            scenarioId: "sc-1",
            name: "Margin call",
            responses: [{ id: "re-1", threatId: "th-1", name: "Raise cash" }]
          }]
        }]
      }]
    });

    expect(protocol.completedMapCount).toBe(1);
    expect(protocol.steps.find((step) => step.id === "stone")?.complete).toBe(true);
    expect(protocol.affectedLineages).toEqual(["FAMILY"]);
    expect(protocol.domains[0]?.canCreateAffair).toBe(true);
    expect(protocol.domains[0]?.doctrineChains[0]?.responseCount).toBe(1);
  });
});
