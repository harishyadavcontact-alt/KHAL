import { describe, expect, it } from "vitest";
import { parseWarRoomNarrative } from "../src/index";

describe("war room narrative parser", () => {
  it("parses headings, key-values, and bullets", () => {
    const parsed = parseWarRoomNarrative([
      "## State of the Art",
      "stakes: high",
      "- signal one",
      "## State of Affairs",
      "- signal two"
    ]);

    expect(Array.isArray((parsed as { blocks: unknown[] }).blocks)).toBe(true);
    expect((parsed as { blocks: { heading: string }[] }).blocks[0].heading).toBe("State of the Art");
  });
});