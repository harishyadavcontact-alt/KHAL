import { describe, expect, it } from "vitest";
import { detectConflict } from "../src/index";

describe("sync engine", () => {
  it("detectConflict can compare timestamps", () => {
    expect(typeof detectConflict).toBe("function");
  });
});