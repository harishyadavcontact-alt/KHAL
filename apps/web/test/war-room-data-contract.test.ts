import { afterEach, beforeEach, describe, expect, it } from "vitest";
import Database from "better-sqlite3";
import { GET as warRoomDataGet } from "../app/api/war-room-data/route";
import { cleanupFixtureDb, createFixtureDb, restoreSettings, snapshotSettings, writeFixtureSettings } from "./support/fixture-db";

describe("war-room-data contract", () => {
  let previousSettings: string | null = null;
  let dbPath = "";

  beforeEach(() => {
    previousSettings = snapshotSettings();
    dbPath = createFixtureDb("khal-war-room-data-", "KHAL-war-room-data.sqlite");
    writeFixtureSettings(dbPath);
  });

  afterEach(() => {
    restoreSettings(previousSettings);
    cleanupFixtureDb(dbPath);
  });

  it("includes source map profiles and response logic for downstream doctrine-aware surfaces", async () => {
    const db = new Database(dbPath);
    try {
      db.exec(`
        INSERT INTO source_map_profiles (id, source_id, domain_id, decision_type, tail_class, quadrant, method_posture, notes, primary_craft_id)
        VALUES ('map-contract', 'src-universe', 'domain-infrastructure-energy', 'complex', 'fat', 'Q4', 'No-ruin first.', 'Contract profile', 'craft-contract');
        INSERT INTO crafts (id, name, description) VALUES ('craft-contract', 'Contract Craft', 'Test craft');
        INSERT INTO knowledge_wargames (id, craft_id, name, description, objective) VALUES ('wg-contract', 'craft-contract', 'Contract WG', 'Test', 'Survive downside');
        INSERT INTO knowledge_scenarios (id, wargame_id, name, description, sort_order) VALUES ('sc-contract', 'wg-contract', 'Scenario', 'Test scenario', 0);
        INSERT INTO knowledge_threats (id, scenario_id, name, description, severity) VALUES ('th-contract', 'sc-contract', 'Threat', 'Test threat', 7);
        INSERT INTO knowledge_responses (id, threat_id, name, description, response_type) VALUES ('rs-contract', 'th-contract', 'Response', 'Test response', 'MITIGATE');
      `);
    } finally {
      db.close();
    }

    const response = await warRoomDataGet();
    const payload = await response.json();

    expect(response.status).toBe(200);
    const source = (payload.sources as Array<{ id: string; mapProfiles?: Array<{ id: string }> }>).find((item) => item.id === "src-universe");
    expect(source?.mapProfiles?.some((profile) => profile.id === "map-contract")).toBe(true);
    expect(Array.isArray(payload.responseLogic)).toBe(true);
    expect((payload.responseLogic as Array<{ id: string }>).some((item) => item.id === "wg-contract")).toBe(true);
    expect(payload.signalBand).toBeDefined();
  });
});
