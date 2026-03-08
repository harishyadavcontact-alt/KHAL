import { afterEach, beforeEach, describe, expect, it } from "vitest";
import Database from "better-sqlite3";
import { evaluateRuntimeInvariants } from "../lib/runtime/invariants";
import { cleanupFixtureDb, createFixtureDb, restoreSettings, snapshotSettings, writeFixtureSettings } from "./support/fixture-db";

function resetOntologyTables(db: Database.Database) {
  db.exec(`
    DELETE FROM portfolio_repo_adapters;
    DELETE FROM portfolio_decision_gates;
    DELETE FROM portfolio_evidence;
    DELETE FROM portfolio_experiments;
    DELETE FROM portfolio_ship_logs;
    DELETE FROM portfolio_projects;
    DELETE FROM draft_entity_links;
    DELETE FROM promotion_events;
    DELETE FROM structural_anchors;
    DELETE FROM draft_blocks;
    DELETE FROM drafts;
    DELETE FROM knowledge_responses;
    DELETE FROM knowledge_threats;
    DELETE FROM knowledge_scenarios;
    DELETE FROM knowledge_wargames;
    DELETE FROM knowledge_heuristics;
    DELETE FROM knowledge_rules;
    DELETE FROM knowledge_protocols;
    DELETE FROM knowledge_stacks;
    DELETE FROM knowledge_entity_links;
    DELETE FROM lineage_entities;
    DELETE FROM lineage_nodes;
    DELETE FROM tasks;
    DELETE FROM interests;
    DELETE FROM affairs;
    DELETE FROM crafts;
    DELETE FROM domains;
    DELETE FROM laws;
  `);
}

function seedCleanGraph(db: Database.Database) {
  db.exec(`
    INSERT INTO laws (id, name, description) VALUES ('law-1', 'Law 1', 'Canonical law');
    INSERT INTO domains (id, code, name) VALUES ('domain-1', 'D1', 'Domain 1');
    INSERT INTO affairs (id, domain_id, title, stakes, risk, status, completion_pct) VALUES ('affair-1', 'domain-1', 'Affair 1', 7, 6, 'IN_PROGRESS', 20);
    INSERT INTO interests (id, domain_id, title, stakes, risk, convexity, status) VALUES ('interest-1', 'domain-1', 'Interest 1', 7, 5, 9, 'IN_PROGRESS');
    INSERT INTO tasks (id, source_type, source_id, title, horizon, status) VALUES ('task-1', 'INTEREST', 'interest-1', 'Protocol bridge', 'WEEK', 'NOT_STARTED');
    INSERT INTO crafts (id, name, description) VALUES ('craft-1', 'Craft 1', 'Canonical craft');
    INSERT INTO knowledge_stacks (id, craft_id, name, sort_order) VALUES ('stack-1', 'craft-1', 'Stack 1', 0);
    INSERT INTO knowledge_protocols (id, craft_id, stack_id, name, sort_order) VALUES ('protocol-1', 'craft-1', 'stack-1', 'Protocol 1', 0);
    INSERT INTO knowledge_rules (id, craft_id, protocol_id, statement, sort_order) VALUES ('rule-1', 'craft-1', 'protocol-1', 'Rule 1', 0);
    INSERT INTO knowledge_heuristics (id, craft_id, protocol_id, rule_id, statement, sort_order) VALUES ('heuristic-1', 'craft-1', 'protocol-1', 'rule-1', 'Heuristic 1', 0);
    INSERT INTO knowledge_wargames (id, craft_id, name) VALUES ('wargame-1', 'craft-1', 'Wargame 1');
    INSERT INTO knowledge_scenarios (id, wargame_id, name, sort_order) VALUES ('scenario-1', 'wargame-1', 'Scenario 1', 0);
    INSERT INTO knowledge_threats (id, scenario_id, name, severity) VALUES ('threat-1', 'scenario-1', 'Threat 1', 6);
    INSERT INTO knowledge_responses (id, threat_id, name, response_type) VALUES ('response-1', 'threat-1', 'Response 1', 'MITIGATE');
    INSERT INTO lineage_nodes (id, level, name, sort_order) VALUES ('node-1', 'SELF', 'Self', 0);
    INSERT INTO lineage_entities (id, lineage_node_id, actor_type, label) VALUES ('entity-1', 'node-1', 'public', 'Entity 1');
  `);
}

describe("runtime invariants", () => {
  let previousSettings: string | null = null;
  let dbPath = "";

  beforeEach(() => {
    previousSettings = snapshotSettings();
    dbPath = createFixtureDb("khal-invariants-", "KHAL-invariants.sqlite");
    writeFixtureSettings(dbPath);
  });

  afterEach(() => {
    restoreSettings(previousSettings);
    cleanupFixtureDb(dbPath);
  });

  it("reports no hard violations for a clean canonical graph", () => {
    const db = new Database(dbPath);
    try {
      resetOntologyTables(db);
      seedCleanGraph(db);
      const report = evaluateRuntimeInvariants({ db });
      expect(report.hardViolations).toHaveLength(0);
      expect(report.softViolations).toHaveLength(0);
    } finally {
      db.close();
    }
  });

  it("classifies broken parent chains as hard and missing responses as soft", () => {
    const db = new Database(dbPath);
    try {
      resetOntologyTables(db);
      seedCleanGraph(db);
      db.prepare("DELETE FROM knowledge_responses WHERE id='response-1'").run();
      db.pragma("foreign_keys = OFF");
      db.prepare("INSERT INTO lineage_entities (id, lineage_node_id, actor_type, label) VALUES (?, ?, ?, ?)").run("entity-bad", "node-missing", "public", "Broken");
      db.pragma("foreign_keys = ON");

      const report = evaluateRuntimeInvariants({ db });
      expect(report.hardViolations.some((item) => item.code === "LINEAGE_ENTITY_MISSING_NODE")).toBe(true);
      expect(report.softViolations.some((item) => item.code === "THREAT_WITHOUT_RESPONSE")).toBe(true);
    } finally {
      db.close();
    }
  });
});
