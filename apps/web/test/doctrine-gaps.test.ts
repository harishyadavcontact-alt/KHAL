import { describe, expect, it } from "vitest";
import { doctrineGapForCraft, doctrineGapReason, missingDoctrineForSourceProfiles } from "../lib/doctrine/gaps";
import type { SourceMapProfileDto } from "../components/war-room-v2/types";
import type { WarGameDoctrineChain } from "../lib/war-room/bootstrap";

describe("doctrine gap helpers", () => {
  it("detects the first missing seam for a craft", () => {
    expect(doctrineGapForCraft("craft-a", [])).toBe("doctrine_chain");

    const noScenarios: WarGameDoctrineChain[] = [{ id: "wg-1", craftId: "craft-a", craftName: "Craft A", name: "WG", scenarios: [] }];
    expect(doctrineGapForCraft("craft-a", noScenarios)).toBe("scenario_logic");

    const noThreats: WarGameDoctrineChain[] = [{
      id: "wg-1",
      craftId: "craft-a",
      craftName: "Craft A",
      name: "WG",
      scenarios: [{ id: "scn-1", wargameId: "wg-1", name: "Scenario", sortOrder: 1, threats: [] }]
    }];
    expect(doctrineGapForCraft("craft-a", noThreats)).toBe("threat_logic");

    const noResponses: WarGameDoctrineChain[] = [{
      id: "wg-1",
      craftId: "craft-a",
      craftName: "Craft A",
      name: "WG",
      scenarios: [{
        id: "scn-1",
        wargameId: "wg-1",
        name: "Scenario",
        sortOrder: 1,
        threats: [{ id: "thr-1", scenarioId: "scn-1", name: "Threat", severity: 5, responses: [] }]
      }]
    }];
    expect(doctrineGapForCraft("craft-a", noResponses)).toBe("response_logic");
  });

  it("maps source profiles to doctrine gaps and keeps readable reasons stable", () => {
    const profiles: SourceMapProfileDto[] = [
      {
        id: "map-1",
        sourceId: "src-1",
        domainId: "dom-1",
        decisionType: "complex",
        tailClass: "fat",
        quadrant: "Q4",
        methodPosture: "No-ruin first.",
        primaryCraftId: "craft-a"
      }
    ];
    expect(missingDoctrineForSourceProfiles(profiles, [])).toEqual(["doctrine_chain"]);
    expect(doctrineGapReason("response_logic")).toContain("responses");
  });
});
