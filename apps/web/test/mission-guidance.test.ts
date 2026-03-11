import { describe, expect, it } from "vitest";
import { buildMissionGuidance } from "../lib/war-room/mission-guidance";
import type { Affair, Domain, Interest, SourceMapProfileDto, VolatilitySourceDto } from "../components/war-room-v2/types";
import type { WarGameDoctrineChain } from "../lib/war-room/bootstrap";

describe("mission guidance", () => {
  it("keeps source-domain doctrine cautions attached to the linked operational records", () => {
    const affairs: Affair[] = [
      {
        id: "aff-1",
        title: "Protect Treasury",
        domainId: "dom-1",
        context: { associatedDomains: ["dom-1"] },
        means: { craftId: "craft-a", selectedHeuristicIds: [] },
        plan: { objectives: ["Raise resilience"] },
        strategy: { mapping: { allies: [], enemies: [] } },
        entities: []
      }
    ];
    const interests: Interest[] = [
      {
        id: "int-1",
        title: "Convex Allocation",
        domainId: "dom-1",
        convexity: 8
      }
    ];
    const domains: Domain[] = [{ id: "dom-1", name: "Finance" }];
    const profiles: SourceMapProfileDto[] = [
      {
        id: "map-1",
        sourceId: "src-1",
        domainId: "dom-1",
        decisionType: "complex",
        tailClass: "fat",
        quadrant: "Q4",
        methodPosture: "No-ruin first.",
        primaryCraftId: "craft-a",
        affairId: "aff-1",
        interestId: "int-1"
      }
    ];
    const sources: VolatilitySourceDto[] = [
      {
        id: "src-1",
        code: "macro",
        name: "Macro Volatility",
        sortOrder: 1,
        domainCount: 1,
        mapProfiles: profiles
      }
    ];

    const responseLogic: WarGameDoctrineChain[] = [];
    const guidance = buildMissionGuidance({ affairs, interests, sources, domains, responseLogic });

    expect(guidance.doctrineLinkedRecords).toHaveLength(2);
    expect(guidance.doctrineLinkedRecords[0].doctrineRefs[0]?.sourceName).toBe("Macro Volatility");
    expect(guidance.doctrineLinkedRecords[0].doctrineRefs[0]?.domainName).toBe("Finance");
  });
});
