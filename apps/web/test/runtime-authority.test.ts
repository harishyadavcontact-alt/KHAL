import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { handleAffair, handleData, handleState } from "../lib/api";
import { cleanupFixtureDb, createFixtureDb, restoreSettings, snapshotSettings, writeFixtureSettings } from "./support/fixture-db";

describe("runtime authority", () => {
  let previousSettings: string | null = null;
  let dbPath = "";

  beforeEach(() => {
    previousSettings = snapshotSettings();
    dbPath = createFixtureDb("khal-runtime-authority-", "KHAL-runtime-authority.sqlite");
    writeFixtureSettings(dbPath);
  });

  afterEach(() => {
    restoreSettings(previousSettings);
    cleanupFixtureDb(dbPath);
  });

  it("reflects canonical writes through the SQLite-backed projection on the next read", async () => {
    const before = await handleData();
    const beforeJson = await before.json();
    const domainId = String(beforeJson.domains[0]?.id);

    const created = await handleAffair({
      title: "Authority lane affair",
      domainId,
      stakes: 8,
      risk: 6,
      status: "IN_PROGRESS"
    });
    expect(created.status).toBe(201);

    const after = await handleData();
    const afterJson = await after.json();
    expect(afterJson.affairs.some((item: { title: string }) => item.title === "Authority lane affair")).toBe(true);
    expect(afterJson.runtimeInvariants.summary.hardViolationCount).toBe(0);
  });

  it("returns ownership and invariant metadata on state reads", async () => {
    const response = await handleState();
    const payload = await response.json();
    expect(Array.isArray(payload.ownership)).toBe(true);
    expect(payload.runtimeInvariants.summary).toBeTruthy();
  });
});
