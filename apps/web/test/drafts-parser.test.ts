import { describe, expect, it } from "vitest";
import { compileDraft, inferDraftStructure } from "../lib/drafts/parser";

describe("drafts prose inference", () => {
  it("infers structure from natural prose without DSL syntax", () => {
    const input = `Looxmax mostly comes down to sleep, training, and diet.
Grooming stack: beard, hair, eyebrows, hygiene.
Never make appearance changes right before important events.`;

    const result = inferDraftStructure(input);
    expect(result.inferred.interests).toContain("Looxmax");
    expect(result.inferred.powerLaws).toEqual(expect.arrayContaining(["sleep", "training", "diet"]));
    expect(result.inferred.stacks[0]?.name).toBe("Grooming");
    expect(result.inferred.rules[0]).toContain("Never make appearance changes");
  });

  it("creates structural anchors, block lenses, and weak-link checks", () => {
    const input = `Physique mostly comes down to sleep, training, and diet.
Never cut sleep right before a peak event.`;
    const result = inferDraftStructure(input);

    expect(result.anchors.some((anchor) => anchor.candidateEntityType === "interest")).toBe(true);
    expect(result.anchors.some((anchor) => anchor.anchorType === "lineage")).toBe(true);
    expect(["entity", "rule"]).toContain(result.blockLenses[0]?.dominantSignal);
    expect(result.weakLinks.some((item) => item.code === "INTEREST_NO_PARENT")).toBe(true);
  });

  it("keeps compile-readable output internal but structured", () => {
    const compiled = compileDraft("Focus: physique. Never skip sleep.");
    expect(compiled.draft.id).toContain("draft_");
    expect(compiled.draft_blocks.length).toBeGreaterThan(0);
    expect(compiled.structural_anchors.length).toBeGreaterThan(0);
    expect(compiled.structural_anchors[0]).toHaveProperty("title");
  });
});
