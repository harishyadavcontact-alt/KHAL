import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { GET as missionBootstrapGet } from "../app/api/mission-command/bootstrap/route";
import { cleanupFixtureDb, createFixtureDb, restoreSettings, snapshotSettings, writeFixtureSettings } from "./support/fixture-db";

describe("mission command bootstrap contract", () => {
  let previousSettings: string | null = null;
  let dbPath = "";

  beforeEach(() => {
    previousSettings = snapshotSettings();
    dbPath = createFixtureDb("khal-mission-bootstrap-", "KHAL-mission-bootstrap.sqlite");
    writeFixtureSettings(dbPath);
  });

  afterEach(() => {
    restoreSettings(previousSettings);
    cleanupFixtureDb(dbPath);
  });

  it("returns mission bootstrap with sources and doctrine payloads", async () => {
    const response = await missionBootstrapGet();
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(Array.isArray(payload.sources)).toBe(true);
    expect(Array.isArray(payload.responseLogic)).toBe(true);
    expect(payload.user).toBeTruthy();
    expect(payload.runtimeInvariants).toBeTruthy();
  });
});
