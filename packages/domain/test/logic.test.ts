import { describe, expect, it } from "vitest";
import { clampRange, computeFragilityScore, computeOptionalityIndex, normalizeStatus, rankDoNow, taskCanBeDone } from "../src/logic";
import type { Task } from "../src/types";

describe("domain logic", () => {
  it("computes fragility score deterministically", () => {
    expect(computeFragilityScore(8, 7)).toBe(56);
    expect(computeFragilityScore(20, 2)).toBe(20);
  });

  it("normalizes statuses", () => {
    expect(normalizeStatus("IN PROGRESS")).toBe("IN_PROGRESS");
    expect(normalizeStatus("unknown")).toBe("NOT_STARTED");
  });

  it("computes optionality index", () => {
    expect(computeOptionalityIndex([{ id: "1", domainId: "d", title: "x", stakes: 5, risk: 2, convexity: 9, status: "NOT_STARTED" }])).toBe(45);
  });

  it("applies dependency guard", () => {
    const dep: Task = { id: "a", sourceType: "AFFAIR", sourceId: "a", dependencyIds: [], title: "dep", horizon: "WEEK", status: "DONE" };
    const task: Task = { id: "b", sourceType: "AFFAIR", sourceId: "a", dependencyIds: ["a"], title: "main", horizon: "WEEK", status: "IN_PROGRESS" };
    expect(taskCanBeDone(task, new Map([["a", dep], ["b", task]]))).toBe(true);
  });

  it("ranks do now list", () => {
    const results = rankDoNow(
      [{ id: "a", domainId: "d", title: "Affair", stakes: 10, risk: 9, status: "NOT_STARTED", completionPct: 0 }],
      [{ id: "i", domainId: "d", title: "Interest", stakes: 3, risk: 2, convexity: 10, status: "NOT_STARTED" }],
      [{ id: "t", sourceType: "AFFAIR", sourceId: "a", dependencyIds: [], title: "Task", horizon: "WEEK", status: "NOT_STARTED" }]
    );

    expect(results[0].refType).toBe("AFFAIR");
  });

  it("clamps values", () => {
    expect(clampRange(15)).toBe(10);
  });
});
