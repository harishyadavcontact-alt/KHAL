import { afterEach, beforeEach, describe, expect, it } from "vitest";
import Database from "better-sqlite3";
import { GET as missionBootstrapGet } from "../app/api/mission-command/bootstrap/route";
import { cleanupFixtureDb, createFixtureDb, restoreSettings, snapshotSettings, writeFixtureSettings } from "./support/fixture-db";

describe("mission-command bootstrap contract", () => {
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

  it("returns doctrine-aware mission payload fields", async () => {
    const db = new Database(dbPath);
    try {
      db.exec(`
        INSERT INTO source_map_profiles (id, source_id, domain_id, decision_type, tail_class, quadrant, method_posture, notes, primary_craft_id)
        VALUES ('map-mission-contract', 'src-universe', 'domain-infrastructure-energy', 'complex', 'fat', 'Q4', 'No-ruin first.', 'Contract profile', 'craft-mission-contract');
        INSERT INTO crafts (id, name, description) VALUES ('craft-mission-contract', 'Mission Contract Craft', 'Test craft');
        INSERT INTO knowledge_wargames (id, craft_id, name, description, objective)
        VALUES ('wg-mission-contract', 'craft-mission-contract', 'Mission Contract WG', 'Test', 'Survive downside');
        INSERT INTO knowledge_scenarios (id, wargame_id, name, description, sort_order)
        VALUES ('sc-mission-contract', 'wg-mission-contract', 'Scenario', 'Test scenario', 0);
        INSERT INTO knowledge_threats (id, scenario_id, name, description, severity)
        VALUES ('th-mission-contract', 'sc-mission-contract', 'Threat', 'Test threat', 7);
        INSERT INTO knowledge_responses (id, threat_id, name, description, response_type)
        VALUES ('rs-mission-contract', 'th-mission-contract', 'Response', 'Test response', 'MITIGATE');
      `);
    } finally {
      db.close();
    }

    const response = await missionBootstrapGet();
    const payload = await response.json();

    expect(response.status).toBe(200);
    const source = (payload.sources as Array<{ id: string; mapProfiles?: Array<{ id: string }> }>).find((item) => item.id === "src-universe");
    expect(source?.mapProfiles?.some((profile) => profile.id === "map-mission-contract")).toBe(true);
    expect((payload.responseLogic as Array<{ id: string }>).some((item) => item.id === "wg-mission-contract")).toBe(true);
    expect(payload.signalBand).toBeDefined();
  });
});
