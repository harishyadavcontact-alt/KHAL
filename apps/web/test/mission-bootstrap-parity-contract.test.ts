import { afterEach, beforeEach, describe, expect, it } from "vitest";
import Database from "better-sqlite3";
import { GET as missionBootstrapGet } from "../app/api/mission-command/bootstrap/route";
import { GET as warRoomDataGet } from "../app/api/war-room-data/route";
import { cleanupFixtureDb, createFixtureDb, restoreSettings, snapshotSettings, writeFixtureSettings } from "./support/fixture-db";

describe("mission bootstrap parity contract", () => {
  let previousSettings: string | null = null;
  let dbPath = "";

  beforeEach(() => {
    previousSettings = snapshotSettings();
    dbPath = createFixtureDb("khal-mission-parity-", "KHAL-mission-parity.sqlite");
    writeFixtureSettings(dbPath);
  });

  afterEach(() => {
    restoreSettings(previousSettings);
    cleanupFixtureDb(dbPath);
  });

  it("keeps doctrine/signal fields aligned with war-room payload", async () => {
    const db = new Database(dbPath);
    try {
      db.exec(`
        INSERT INTO source_map_profiles (id, source_id, domain_id, decision_type, tail_class, quadrant, method_posture, notes, primary_craft_id)
        VALUES ('map-parity', 'src-universe', 'domain-infrastructure-energy', 'complex', 'fat', 'Q4', 'No-ruin first.', 'Parity profile', 'craft-parity');
        INSERT INTO crafts (id, name, description) VALUES ('craft-parity', 'Parity Craft', 'Test craft');
        INSERT INTO knowledge_wargames (id, craft_id, name, description, objective)
        VALUES ('wg-parity', 'craft-parity', 'Parity WG', 'Test', 'Survive downside');
        INSERT INTO knowledge_scenarios (id, wargame_id, name, description, sort_order)
        VALUES ('sc-parity', 'wg-parity', 'Scenario', 'Test scenario', 0);
        INSERT INTO knowledge_threats (id, scenario_id, name, description, severity)
        VALUES ('th-parity', 'sc-parity', 'Threat', 'Test threat', 7);
        INSERT INTO knowledge_responses (id, threat_id, name, description, response_type)
        VALUES ('rs-parity', 'th-parity', 'Response', 'Test response', 'MITIGATE');
      `);
    } finally {
      db.close();
    }

    const missionResponse = await missionBootstrapGet();
    const missionPayload = await missionResponse.json();

    const warRoomResponse = await warRoomDataGet();
    const warRoomPayload = await warRoomResponse.json();

    expect(missionResponse.status).toBe(200);
    expect(warRoomResponse.status).toBe(200);

    expect(missionPayload.signalBand).toBe(warRoomPayload.signalBand);
    expect(Array.isArray(missionPayload.responseLogic)).toBe(true);
    expect(Array.isArray(warRoomPayload.responseLogic)).toBe(true);
    expect((missionPayload.responseLogic as Array<{ id: string }>).some((item) => item.id === "wg-parity")).toBe(true);
    expect((warRoomPayload.responseLogic as Array<{ id: string }>).some((item) => item.id === "wg-parity")).toBe(true);
  });
});
