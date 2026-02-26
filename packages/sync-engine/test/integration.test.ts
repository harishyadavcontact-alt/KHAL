import { mkdtempSync, utimesSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import { initDatabase } from "@khal/sqlite-core";
import { loadState, writeAffair, writeInterest, writeTask } from "../src/index";

function fixtureDb(): string {
  const tempDir = mkdtempSync(path.join(tmpdir(), "khal-sync-db-"));
  const dbPath = path.join(tempDir, "KHAL-test.sqlite");
  initDatabase(dbPath);
  return dbPath;
}

describe("sync engine integration", () => {
  it("persists affair and returns it in state", () => {
    const dbPath = fixtureDb();
    const created = writeAffair(dbPath, {
      id: randomUUID(),
      title: "Integration Affair",
      domainId: "integration",
      stakes: 6,
      risk: 7,
      completionPct: 0
    });

    const loaded = loadState(dbPath);
    expect(loaded.state.affairs.some((item) => item.id === created.id)).toBe(true);
  });

  it("persists interest and affects optionality", () => {
    const dbPath = fixtureDb();
    writeInterest(dbPath, {
      id: randomUUID(),
      title: "Integration Interest",
      domainId: "integration",
      stakes: 5,
      risk: 4,
      convexity: 8
    });

    const loaded = loadState(dbPath);
    expect(loaded.dashboard.optionalityIndex).toBeGreaterThan(0);
  });

  it("blocks task done transition if dependencies not done", () => {
    const dbPath = fixtureDb();
    const loaded = loadState(dbPath);

    expect(() =>
      writeTask(
        dbPath,
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

  it("requires refresh on stale db write", () => {
    const dbPath = fixtureDb();
    const loaded = loadState(dbPath);

    const now = new Date();
    utimesSync(dbPath, now, new Date(now.getTime() + 2000));

    expect(() =>
      writeAffair(
        dbPath,
        {
          id: randomUUID(),
          title: "Stale Affair"
        },
        loaded.sync.modifiedAt
      )
    ).toThrow(/refresh/i);
  });
});