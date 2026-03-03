import { describe, expect, it } from "vitest";
import { canonicalSlotFromLabel, lawAliasForLabel, lawAliasForSlot } from "../lib/war-room/law-aliases";

describe("law aliases", () => {
  it("maps canonical slots to doctrine aliases", () => {
    expect(lawAliasForSlot("universe")).toBe("Universe / Physics");
    expect(lawAliasForSlot("nature")).toBe("Nature");
    expect(lawAliasForSlot("nurture")).toBe("Nurture");
    expect(lawAliasForSlot("land")).toBe("Land (Politics)");
    expect(lawAliasForSlot("time")).toBe("Trade (Time)");
    expect(lawAliasForSlot("law6")).toBe("Jungle");
  });

  it("resolves labels back to canonical slot keys", () => {
    expect(canonicalSlotFromLabel("Law of Universe")).toBe("universe");
    expect(canonicalSlotFromLabel("Laws of Physics")).toBe("universe");
    expect(canonicalSlotFromLabel("Law of Time")).toBe("time");
    expect(canonicalSlotFromLabel("Trade")).toBe("time");
    expect(canonicalSlotFromLabel("Law of Land")).toBe("land");
    expect(canonicalSlotFromLabel("Law of Jungle")).toBe("law6");
  });

  it("changes display labels without changing canonical mapping behavior", () => {
    const input = "Law of Time";
    const slot = canonicalSlotFromLabel(input);
    expect(slot).toBe("time");
    expect(lawAliasForLabel(input)).toBe("Trade (Time)");
  });
});
