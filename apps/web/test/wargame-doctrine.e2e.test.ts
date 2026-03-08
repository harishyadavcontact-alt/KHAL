import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { handleData } from "../lib/api";
import { handleDoctrineRulebooksGet, handleDomainPnLLadderGet, handleDomainPnLLadderPut } from "../lib/api/doctrine";
import { handlePlansCreate, handlePlansGet } from "../lib/api/plans";
import { cleanupFixtureDb, createFixtureDb, restoreSettings, snapshotSettings, writeFixtureSettings } from "./support/fixture-db";

describe("war game doctrine e2e", () => {
  let previousSettings: string | null = null;
  let dbPath = "";

  beforeEach(() => {
    previousSettings = snapshotSettings();
    dbPath = createFixtureDb("khal-web-e2e-", "KHAL-e2e.sqlite");
    writeFixtureSettings(dbPath);
  });

  afterEach(() => {
    restoreSettings(previousSettings);
    cleanupFixtureDb(dbPath);
  });

  it("resolves doctrine overlay, persists ladder, and round-trips doctrine extras in plans", async () => {
    const doctrineRes = await handleDoctrineRulebooksGet(undefined, undefined, "interest");
    const doctrinePayload = await doctrineRes.json();
    expect(Array.isArray(doctrinePayload.rulebooks)).toBe(true);
    expect(Array.isArray(doctrinePayload.rules)).toBe(true);
    expect(doctrinePayload.rulebooks.length).toBeGreaterThan(0);
    expect(doctrinePayload.rules.some((rule: { severity: string }) => rule.severity === "HARD_GATE")).toBe(true);

    const dataRes = await handleData();
    const appData = await dataRes.json();
    const domainId = String(appData.domains[0]?.id ?? "domain-economic-power");

    const ladderPutRes = await handleDomainPnLLadderPut(domainId, {
      levels: [
        {
          level: 1,
          levelName: "Fragility containment",
          threshold: { fragilityRemoved: ">= 1 major fragility removed" },
          status: "ACTIVE",
          evidence: { note: "initial containment complete" }
        }
      ]
    });
    const ladderPutPayload = await ladderPutRes.json();
    expect(ladderPutPayload.domainId).toBe(domainId);
    expect(ladderPutPayload.levels.length).toBe(1);

    const ladderGetRes = await handleDomainPnLLadderGet(domainId);
    const ladderGetPayload = await ladderGetRes.json();
    expect(ladderGetPayload.levels[0].status).toBe("ACTIVE");

    const planRes = await handlePlansCreate({
      sourceType: "INTEREST",
      sourceId: "interest-e2e-option",
      title: "E2E Doctrine Plan",
      cadence: "weekly",
      criteria: [{ name: "ORK", description: "Validate convex optionality" }],
      thresholds: [{ name: "max-loss", value: "1R" }],
      preparation: { notes: "prepare downside cap first" },
      extras: {
        protocolVersion: "v0.2.6",
        doctrineVersion: "v0.2.6",
        ruleChecks: [{ ruleId: "dr-global-no-ruin", passed: true }],
        skinInGame: {
          capitalAtRisk: "2R",
          timeAtRisk: "8h/week"
        },
        omissionCadence: { cadence: "weekly" }
      }
    });
    const planPayload = await planRes.json();
    expect(planPayload.sourceType).toBe("INTEREST");
    expect(planPayload.extras?.doctrineVersion).toBe("v0.2.6");

    const plansGetRes = await handlePlansGet("INTEREST", "interest-e2e-option");
    const plansGetPayload = await plansGetRes.json();
    expect(plansGetPayload.length).toBeGreaterThan(0);
    expect(plansGetPayload[0].extras?.ruleChecks?.length).toBeGreaterThan(0);
  });
});
