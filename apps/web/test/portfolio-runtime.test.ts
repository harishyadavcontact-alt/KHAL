import { afterEach, beforeEach, describe, expect, it } from "vitest";
import Database from "better-sqlite3";
import {
  handlePortfolioBySlug,
  handlePortfolioCreate,
  handlePortfolioDecisionGateCreate,
  handlePortfolioEvidenceCreate,
  handlePortfolioExperimentCreate,
  handlePortfolioPatch,
  handlePortfolioShipLogCreate
} from "../lib/portfolio/store";
import { cleanupFixtureDb, createFixtureDb, restoreSettings, snapshotSettings, writeFixtureSettings } from "./support/fixture-db";

function resetPortfolioTables(db: Database.Database) {
  db.exec(`
    DELETE FROM portfolio_repo_adapters;
    DELETE FROM portfolio_decision_gates;
    DELETE FROM portfolio_evidence;
    DELETE FROM portfolio_experiments;
    DELETE FROM portfolio_ship_logs;
    DELETE FROM portfolio_projects;
  `);
}

function ensureInterest(db: Database.Database) {
  db.prepare("INSERT OR IGNORE INTO domains (id, code, name) VALUES ('domain-portfolio', 'PORT', 'Portfolio Domain')").run();
  db.prepare(
    "INSERT OR IGNORE INTO interests (id, domain_id, title, stakes, risk, convexity, status) VALUES ('interest-portfolio', 'domain-portfolio', 'Portfolio Interest', 6, 3, 8, 'IN_PROGRESS')"
  ).run();
}

describe("portfolio war room runtime", () => {
  let previousSettings: string | null = null;
  let dbPath = "";

  beforeEach(() => {
    previousSettings = snapshotSettings();
    dbPath = createFixtureDb("khal-portfolio-runtime-", "KHAL-portfolio-runtime.sqlite");
    writeFixtureSettings(dbPath);

    const db = new Database(dbPath);
    try {
      resetPortfolioTables(db);
      ensureInterest(db);
    } finally {
      db.close();
    }
  });

  afterEach(() => {
    restoreSettings(previousSettings);
    cleanupFixtureDb(dbPath);
  });

  it("creates a project, records operating motion, and supports archive/restore", async () => {
    const createResponse = await handlePortfolioCreate({
      name: "Atlas",
      strategicRole: "core",
      stage: "build",
      linkedInterestId: "interest-portfolio",
      currentBottleneck: "Need the first shipping proof",
      nextMilestone: "Ship the first command board",
      signalBand: "watch"
    });
    expect(createResponse.status).toBe(201);
    const createdPayload = await createResponse.json();
    const slug = createdPayload.created.project.slug as string;
    expect(slug).toBe("atlas");

    await handlePortfolioShipLogCreate(slug, {
      title: "Initial ship",
      type: "code",
      summary: "Portfolio route and dashboard shipped.",
      shippedAt: "2026-03-09"
    });
    await handlePortfolioExperimentCreate(slug, {
      title: "Command-board experiment",
      hypothesis: "A visual board will improve attention allocation.",
      expectedLearning: "Whether the right project gets attention faster.",
      status: "active",
      startedAt: "2026-03-09"
    });
    await handlePortfolioEvidenceCreate(slug, {
      title: "Operator signal",
      type: "decision",
      summary: "Cross-project chaos justified a portfolio command layer.",
      impact: "Supports continuing the feature.",
      recordedAt: "2026-03-09"
    });
    await handlePortfolioDecisionGateCreate(slug, {
      title: "Continue only if attention improves",
      gateType: "continue",
      criteria: "Keep the surface if it changes what gets attention this week.",
      status: "open",
      dueAt: "2026-03-15"
    });

    const detailResponse = await handlePortfolioBySlug(slug);
    const detail = await detailResponse.json();
    expect(detail.project.linkedInterest.title).toBe("Portfolio Interest");
    expect(detail.shipLogs).toHaveLength(1);
    expect(detail.experiments).toHaveLength(1);
    expect(detail.evidence).toHaveLength(1);
    expect(detail.decisionGates).toHaveLength(1);

    const archiveResponse = await handlePortfolioPatch(slug, {
      strategicRole: "archive",
      stage: "archived",
      isActive: false,
      notes: "Archived after capturing the first lesson."
    });
    const archivedPayload = await archiveResponse.json();
    expect(archivedPayload.project.project.isActive).toBe(false);
    expect(archivedPayload.snapshot.cemetery.some((entry: { project: { slug: string } }) => entry.project.slug === slug)).toBe(true);

    const restoreResponse = await handlePortfolioPatch(slug, {
      strategicRole: "option",
      stage: "framing",
      isActive: true
    });
    const restoredPayload = await restoreResponse.json();
    expect(restoredPayload.project.project.isActive).toBe(true);
    expect(restoredPayload.project.project.strategicRole).toBe("option");
  });
});
