import { describe, expect, it } from "vitest";
import { doctrineGapForCraft, doctrineGapReason, missingDoctrineForSourceProfiles, unresolvedDoctrineGapByDomain } from "../lib/doctrine/gaps";
import type { SourceMapProfileDto, VolatilitySourceDto } from "../components/war-room-v2/types";
import type { WarGameDoctrineChain } from "../lib/war-room/bootstrap";

describe("doctrine gaps canonical evaluator", () => {
  it("detects gap sequence for a craft", () => {
    expect(doctrineGapForCraft("c1", [])).toBe("doctrine_chain");
    expect(doctrineGapForCraft("c1", [{ id: "wg", craftId: "c1", craftName: "C1", name: "WG", scenarios: [] }])).toBe("scenario_logic");
    expect(
      doctrineGapForCraft("c1", [{ id: "wg", craftId: "c1", craftName: "C1", name: "WG", scenarios: [{ id: "s", wargameId: "wg", name: "S", sortOrder: 0, threats: [] }] }])
    ).toBe("threat_logic");
    expect(
      doctrineGapForCraft("c1", [{ id: "wg", craftId: "c1", craftName: "C1", name: "WG", scenarios: [{ id: "s", wargameId: "wg", name: "S", sortOrder: 0, threats: [{ id: "t", scenarioId: "s", name: "T", responses: [] }] }] }])
    ).toBe("response_logic");
  });

  it("stays deterministic for source profile doctrine checks", () => {
    const profiles: SourceMapProfileDto[] = [
      { id: "m1", sourceId: "s1", domainId: "d1", decisionType: "complex", tailClass: "fat", quadrant: "Q4", methodPosture: "No-ruin", primaryCraftId: "c1" }
    ];
    const responseLogic: WarGameDoctrineChain[] = [{ id: "wg", craftId: "c1", craftName: "C1", name: "WG", scenarios: [] }];
    const first = missingDoctrineForSourceProfiles(profiles, responseLogic);
    const second = missingDoctrineForSourceProfiles(profiles, responseLogic);
    expect(first).toEqual(second);
    expect(first).toEqual(["scenario_logic"]);
  });

  it("maps unresolved gaps by domain and exposes readable reason", () => {
    const sources: VolatilitySourceDto[] = [{
      id: "s1",
      code: "macro",
      name: "Macro",
      sortOrder: 1,
      domainCount: 1,
      mapProfiles: [{ id: "m1", sourceId: "s1", domainId: "d1", decisionType: "complex", tailClass: "fat", quadrant: "Q4", methodPosture: "No-ruin", primaryCraftId: "c1" }]
    }];
    const gaps = unresolvedDoctrineGapByDomain(sources, []);
    expect(gaps.get("d1")).toBe("doctrine_chain");
    expect(doctrineGapReason("doctrine_chain")).toContain("no doctrine chain");
  });
});
