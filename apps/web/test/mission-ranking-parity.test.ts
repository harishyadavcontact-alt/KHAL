import { describe, expect, it } from "vitest";
import type { Affair, Interest } from "../components/war-room-v2/types";
import { buildMissionRecommendedOrder as buildFromComponent } from "../components/war-room-v2/wargame_mission";
import { buildMissionRecommendedOrder as buildFromLib } from "../lib/war-room/mission-ranking";

describe("mission ranking parity", () => {
  const affairs: Affair[] = [
    {
      id: "a1",
      title: "Contain downside",
      domainId: "d1",
      stakes: 8,
      risk: 4,
      context: { associatedDomains: ["d1"] },
      means: { craftId: "c1", selectedHeuristicIds: [] },
      plan: { objectives: ["hedge"] },
      strategy: { mapping: { allies: [], enemies: [] } },
      entities: []
    },
    {
      id: "a2",
      title: "Fragile doctrine",
      domainId: "d2",
      stakes: 9,
      risk: 4,
      context: { associatedDomains: ["d2"] },
      means: { craftId: "c2", selectedHeuristicIds: [] },
      plan: { objectives: ["stabilize"] },
      strategy: { mapping: { allies: [], enemies: [] } },
      entities: []
    }
  ];

  const interests: Interest[] = [
    { id: "i1", title: "Optional upside", domainId: "d1", convexity: 7 },
    { id: "i2", title: "Unprepared upside", domainId: "d2", convexity: 8 }
  ];

  const doctrineGapByDomain = new Map<string, string>([["d2", "missing responses"]]);

  it("keeps component wrapper output in parity with shared lib", () => {
    const fromComponent = buildFromComponent({ affairs, interests, doctrineGapByDomain });
    const fromLib = buildFromLib({ affairs, interests, doctrineGapByDomain });
    expect(fromComponent).toEqual(fromLib);
  });

  it("is deterministic across repeated runs", () => {
    const first = buildFromLib({ affairs, interests, doctrineGapByDomain });
    const second = buildFromLib({ affairs, interests, doctrineGapByDomain });
    const third = buildFromLib({ affairs, interests, doctrineGapByDomain });
    expect(first).toEqual(second);
    expect(second).toEqual(third);
  });
});
