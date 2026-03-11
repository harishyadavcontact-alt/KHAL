import { describe, expect, it } from "vitest";
import { buildMissionRecommendedOrder, unresolvedDoctrineGapByDomain } from "../components/war-room-v2/wargame_mission";
import type { Affair, Interest, VolatilitySourceDto } from "../components/war-room-v2/types";
import type { WarGameDoctrineChain } from "../lib/war-room/bootstrap";

describe("mission ordering doctrine penalties", () => {
  it("penalizes entities linked to domains with unresolved doctrine responses", () => {
    const sources: VolatilitySourceDto[] = [
      {
        id: "s1",
        code: "macro",
        name: "Macro",
        sortOrder: 1,
        domainCount: 2,
        mapProfiles: [
          {
            id: "m1",
            sourceId: "s1",
            domainId: "d1",
            decisionType: "complex",
            tailClass: "fat",
            quadrant: "Q4",
            methodPosture: "No-ruin first",
            primaryCraftId: "c1"
          },
          {
            id: "m2",
            sourceId: "s1",
            domainId: "d2",
            decisionType: "complex",
            tailClass: "fat",
            quadrant: "Q4",
            methodPosture: "No-ruin first",
            primaryCraftId: "c2"
          }
        ]
      }
    ];

    const responseLogic: WarGameDoctrineChain[] = [
      {
        id: "wg1",
        craftId: "c1",
        craftName: "Craft 1",
        name: "WG 1",
        scenarios: [
          {
            id: "sc1",
            wargameId: "wg1",
            name: "Scenario",
            sortOrder: 0,
            threats: [
              {
                id: "th1",
                scenarioId: "sc1",
                name: "Threat",
                responses: [{ id: "r1", threatId: "th1", name: "Response" }]
              }
            ]
          }
        ]
      },
      {
        id: "wg2",
        craftId: "c2",
        craftName: "Craft 2",
        name: "WG 2",
        scenarios: [
          {
            id: "sc2",
            wargameId: "wg2",
            name: "Scenario",
            sortOrder: 0,
            threats: [{ id: "th2", scenarioId: "sc2", name: "Threat", responses: [] }]
          }
        ]
      }
    ];

    const doctrineGapByDomain = unresolvedDoctrineGapByDomain(sources, responseLogic);
    expect(String(doctrineGapByDomain.get("d2"))).toContain("missing responses");

    const affairs: Affair[] = [
      {
        id: "a-safe",
        title: "Safe affair",
        domainId: "d1",
        stakes: 10,
        risk: 1,
        context: { associatedDomains: ["d1"] },
        means: { craftId: "c1", selectedHeuristicIds: [] },
        plan: { objectives: [] },
        strategy: { mapping: { allies: [], enemies: [] } },
        entities: []
      },
      {
        id: "a-penalized",
        title: "Penalized affair",
        domainId: "d2",
        stakes: 8,
        risk: 4,
        context: { associatedDomains: ["d2"] },
        means: { craftId: "c2", selectedHeuristicIds: [] },
        plan: { objectives: [] },
        strategy: { mapping: { allies: [], enemies: [] } },
        entities: []
      }
    ];

    const interests: Interest[] = [
      { id: "i-safe", title: "Safe interest", domainId: "d1", convexity: 6 },
      { id: "i-penalized", title: "Penalized interest", domainId: "d2", convexity: 8 }
    ];

    const ordered = buildMissionRecommendedOrder({ affairs, interests, doctrineGapByDomain });
    expect(ordered.find((item) => item.id === "a-penalized")?.penalizedByDoctrineGap).toBe(true);
    expect(ordered.find((item) => item.id === "i-penalized")?.penalizedByDoctrineGap).toBe(true);
    expect(ordered.findIndex((item) => item.id === "a-safe")).toBeLessThan(ordered.findIndex((item) => item.id === "a-penalized"));
    expect(ordered.findIndex((item) => item.id === "i-safe")).toBeLessThan(ordered.findIndex((item) => item.id === "i-penalized"));
  });
});
