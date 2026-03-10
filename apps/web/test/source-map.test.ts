import { afterEach, beforeEach, describe, expect, it } from "vitest";
import Database from "better-sqlite3";
import { deriveQuadrant, methodPostureForQuadrant } from "../lib/war-room/source-map";
import { handleSourceMapPut, handleSourceMapStateOfAffairs } from "../lib/api/source-map";
import { cleanupFixtureDb, createFixtureDb, restoreSettings, snapshotSettings, writeFixtureSettings } from "./support/fixture-db";

describe("source map doctrine", () => {
  let previousSettings: string | null = null;
  let dbPath = "";

  beforeEach(() => {
    previousSettings = snapshotSettings();
    dbPath = createFixtureDb("khal-web-source-map-", "KHAL-source-map.sqlite");
    writeFixtureSettings(dbPath);
  });

  afterEach(() => {
    restoreSettings(previousSettings);
    cleanupFixtureDb(dbPath);
  });

  it("derives quadrants from decision structure and tail behavior", () => {
    expect(deriveQuadrant("simple", "thin")).toBe("Q1");
    expect(deriveQuadrant("simple", "fat")).toBe("Q2");
    expect(deriveQuadrant("complex", "thin")).toBe("Q3");
    expect(deriveQuadrant("complex", "fat")).toBe("Q4");
    expect(deriveQuadrant("complex", "unknown")).toBe("Q4");
  });

  it("returns a no-ruin posture for Q4", () => {
    expect(methodPostureForQuadrant("Q4")).toContain("No-ruin first");
  });

  it("persists philosopher's stone and means fields on the canonical source-domain profile", async () => {
    const response = await handleSourceMapPut("src-universe", {
      domainId: "domain-infrastructure-energy",
      decisionType: "complex",
      tailClass: "fat",
      stakesText: "Capital survival and continuity.",
      risksText: "Liquidity shock and forced sale.",
      playersText: "Fragilistas who intervene without skin in the game.",
      lineageThreatText: "Self, family, and downstream obligations.",
      fragilityPosture: "fragile",
      vulnerabilitiesText: "Leverage and serial dependence.",
      hedgeText: "Hold cash and shorten commitments.",
      edgeText: "Keep small convex bets alive.",
      primaryCraftId: "craft-bellwether",
      heuristicsText: "Default to no-ruin; prefer optionality.",
      avoidText: "Avoid leverage and point forecasts."
    });
    const payload = await response.json();

    expect(payload.quadrant).toBe("Q4");
    expect(payload.stakesText).toContain("Capital survival");
    expect(payload.primaryCraftId).toBe("craft-bellwether");

    const verifyDb = new Database(dbPath, { readonly: true });
    try {
      const row = verifyDb
        .prepare(
          `SELECT stakes_text, fragility_posture, hedge_text, edge_text, primary_craft_id, heuristics_text, avoid_text
           FROM source_map_profiles
           WHERE source_id='src-universe' AND domain_id='domain-infrastructure-energy'`
        )
        .get() as Record<string, string>;
      expect(row.stakes_text).toBe("Capital survival and continuity.");
      expect(row.fragility_posture).toBe("fragile");
      expect(row.hedge_text).toBe("Hold cash and shorten commitments.");
      expect(row.edge_text).toBe("Keep small convex bets alive.");
      expect(row.primary_craft_id).toBe("craft-bellwether");
      expect(row.heuristics_text).toContain("no-ruin");
      expect(row.avoid_text).toContain("point forecasts");
    } finally {
      verifyDb.close();
    }
  });

  it("creates linked affair and interest records from one source-domain profile", async () => {
    const db = new Database(dbPath);
    try {
      db.exec(`
        INSERT INTO crafts (id, name, description) VALUES ('craft-bellwether', 'Bellwether', 'Test craft');
      `);
    } finally {
      db.close();
    }

    await handleSourceMapPut("src-universe", {
      domainId: "domain-infrastructure-energy",
      decisionType: "complex",
      tailClass: "fat",
      stakesText: "Capital survival and continuity.",
      risksText: "Liquidity shock and forced sale.",
      fragilityPosture: "fragile",
      vulnerabilitiesText: "Leverage and serial dependence.",
      hedgeText: "Hold cash and shorten commitments.",
      edgeText: "Keep small convex bets alive.",
      primaryCraftId: "craft-bellwether",
      heuristicsText: "Default to no-ruin; prefer optionality.",
      avoidText: "Avoid leverage and point forecasts."
    });

    const affairResponse = await handleSourceMapStateOfAffairs("src-universe", {
      domainId: "domain-infrastructure-energy",
      kind: "affair"
    });
    const interestResponse = await handleSourceMapStateOfAffairs("src-universe", {
      domainId: "domain-infrastructure-energy",
      kind: "interest"
    });

    const affairPayload = await affairResponse.json();
    const interestPayload = await interestResponse.json();

    expect(affairPayload.kind).toBe("affair");
    expect(interestPayload.kind).toBe("interest");

    const verifyDb = new Database(dbPath, { readonly: true });
    try {
      const linked = verifyDb
        .prepare(
          `SELECT affair_id, interest_id
           FROM source_map_profiles
           WHERE source_id='src-universe' AND domain_id='domain-infrastructure-energy'`
        )
        .get() as Record<string, string>;
      expect(linked.affair_id).toBe(affairPayload.id);
      expect(linked.interest_id).toBe(interestPayload.id);

      const affair = verifyDb.prepare("SELECT title FROM affairs WHERE id=?").get(affairPayload.id) as Record<string, string>;
      const interest = verifyDb.prepare("SELECT title, hypothesis FROM interests WHERE id=?").get(interestPayload.id) as Record<string, string>;
      expect(affair.title).toContain("Hedge:");
      expect(interest.title).toContain("Edge:");
      expect(interest.hypothesis).toContain("Keep small convex bets alive.");
    } finally {
      verifyDb.close();
    }
  });
});
