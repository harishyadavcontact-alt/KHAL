import { afterEach, beforeEach, describe, expect, it } from "vitest";
import Database from "better-sqlite3";
import { handleWarGamingBootstrapGet } from "../lib/api/wargaming";
import { cleanupFixtureDb, createFixtureDb, restoreSettings, snapshotSettings, writeFixtureSettings } from "./support/fixture-db";

describe("war gaming bootstrap", () => {
  let previousSettings: string | null = null;
  let dbPath = "";

  beforeEach(() => {
    previousSettings = snapshotSettings();
    dbPath = createFixtureDb("khal-web-wargaming-", "KHAL-wargaming.sqlite");
    writeFixtureSettings(dbPath);
  });

  afterEach(() => {
    restoreSettings(previousSettings);
    cleanupFixtureDb(dbPath);
  });

  it("returns a focused runtime payload for the war-gaming route", async () => {
    const db = new Database(dbPath);
    try {
      db.exec(`
        INSERT INTO source_map_profiles (id, source_id, domain_id, decision_type, tail_class, quadrant, method_posture, notes)
        VALUES ('source-map-bootstrap', 'src-universe', 'domain-infrastructure-energy', 'complex', 'fat', 'Q4', 'No-ruin first. Use barbell posture, heuristics, optionality, and limited intervention. Avoid overconfident prediction.', 'Macro source-domain pair');
        INSERT INTO crafts (id, name, description) VALUES ('craft-bootstrap', 'Bootstrap Craft', 'Test craft');
        INSERT INTO knowledge_wargames (id, craft_id, name, description, objective) VALUES ('wargame-bootstrap', 'craft-bootstrap', 'Bootstrap Wargame', 'Test chain', 'Protect downside');
        INSERT INTO knowledge_scenarios (id, wargame_id, name, description, sort_order) VALUES ('scenario-bootstrap', 'wargame-bootstrap', 'Shock scenario', 'Macro shock', 0);
        INSERT INTO knowledge_threats (id, scenario_id, name, description, severity) VALUES ('threat-bootstrap', 'scenario-bootstrap', 'Liquidity freeze', 'Liquidity disappears', 8);
        INSERT INTO knowledge_responses (id, threat_id, name, description, response_type) VALUES ('response-bootstrap', 'threat-bootstrap', 'Raise cash', 'Reduce exposure immediately', 'MITIGATE');
      `);
    } finally {
      db.close();
    }

    const response = await handleWarGamingBootstrapGet();
    const payload = await response.json();

    expect(payload.user?.name).toBeDefined();
    expect(Array.isArray(payload.sources)).toBe(true);
    expect(Array.isArray(payload.domains)).toBe(true);
    expect(Array.isArray(payload.affairs)).toBe(true);
    expect(Array.isArray(payload.interests)).toBe(true);
    expect(Array.isArray(payload.tasks)).toBe(true);
    expect(Array.isArray(payload.lineageRisks)).toBe(true);
    expect(payload.lineages?.nodes).toBeDefined();
    expect(payload.onboarding).toEqual({ onboarded: false });
    expect(Array.isArray(payload.responseLogic)).toBe(true);
    const seededSource = payload.sources.find((item: { id: string }) => item.id === "src-universe");
    expect(seededSource?.mapProfiles?.some((profile: { quadrant: string }) => profile.quadrant === "Q4")).toBe(true);
    const insertedChain = payload.responseLogic.find((item: { id: string }) => item.id === "wargame-bootstrap");
    expect(insertedChain?.craftName).toBe("Bootstrap Craft");
    expect(insertedChain?.scenarios[0]?.threats[0]?.responses.some((response: { name: string }) => response.name === "Raise cash")).toBe(true);
    expect("strategyMatrix" in payload).toBe(false);
    expect("laws" in payload).toBe(false);
    expect("decisionAcceleration" in payload).toBe(false);
  });
});
