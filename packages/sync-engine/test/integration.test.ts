import { cpSync, mkdtempSync, utimesSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import { loadState, writeAffair, writeInterest, writeTask } from "../src/index";

function fixtureWorkbook(): string {
  const tempDir = mkdtempSync(path.join(tmpdir(), "khal-sync-"));
  const target = path.join(tempDir, "Genesis-test.xlsx");
  cpSync(path.resolve(process.cwd(), "..", "..", "Genesis.xlsx"), target);
  return target;
}

describe("sync engine integration", () => {
  it("persists affair and returns it in state", () => {
    const workbookPath = fixtureWorkbook();
    const created = writeAffair(workbookPath, {
      id: randomUUID(),
      title: "Integration Affair",
      domainId: "integration",
      stakes: 6,
      risk: 7,
      completionPct: 0
    });

    const loaded = loadState(workbookPath);
    expect(loaded.state.affairs.some((item) => item.id === created.id)).toBe(true);
  });

  it("persists interest and affects optionality", () => {
    const workbookPath = fixtureWorkbook();
    writeInterest(workbookPath, {
      id: randomUUID(),
      title: "Integration Interest",
      domainId: "integration",
      stakes: 5,
      risk: 4,
      convexity: 8
    });

    const loaded = loadState(workbookPath);
    expect(loaded.dashboard.optionalityIndex).toBeGreaterThan(0);
  });

  it("blocks task done transition if dependencies not done", () => {
    const workbookPath = fixtureWorkbook();
    const loaded = loadState(workbookPath);

    expect(() =>
      writeTask(
        workbookPath,
        {
          id: randomUUID(),
          title: "Blocked Task",
          sourceType: "AFFAIR",
          sourceId: "integration",
          status: "DONE",
          dependencyIds: ["missing-task"]
        },
        loaded.state.tasks
      )
    ).toThrow(/dependencies/i);
  });

  it("requires refresh on stale workbook write", () => {
    const workbookPath = fixtureWorkbook();
    const loaded = loadState(workbookPath);

    const now = new Date();
    utimesSync(workbookPath, now, new Date(now.getTime() + 2000));

    expect(() =>
      writeAffair(
        workbookPath,
        {
          id: randomUUID(),
          title: "Stale Affair"
        },
        loaded.sync.modifiedAt
      )
    ).toThrow(/refresh/i);
  });
});