import { existsSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { validateWorkbook } from "../src/index";

describe("workbook access", () => {
  it("finds and validates Genesis.xlsx template from repo root", () => {
    const workbookPath = path.resolve(process.cwd(), "..", "..", "Genesis.xlsx");
    expect(existsSync(workbookPath)).toBe(true);

    const result = validateWorkbook(workbookPath);

    expect(result.ok).toBe(true);
    expect(result.sheets.length).toBeGreaterThan(0);
    expect(result.sheets.some((name) => name.trim().toLowerCase() === "war room")).toBe(true);
  });
});

