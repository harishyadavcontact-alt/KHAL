import { afterEach, beforeEach, describe, expect, it } from "vitest";
import Database from "better-sqlite3";
import { POST as dryRunPost } from "../app/api/agent/wargame/dry-run/route";
import { POST as commitPost } from "../app/api/agent/wargame/commit/route";
import { POST as evaluatePost } from "../app/api/decision/evaluate/route";
import { POST as overridePost } from "../app/api/decision/override/route";
import { POST as triagePost } from "../app/api/decision/triage/route";
import { POST as quickActionPost } from "../app/api/decision/quick-action/route";
import { cleanupFixtureDb, createFixtureDb, restoreSettings, snapshotSettings, writeFixtureSettings } from "./support/fixture-db";

function postJson(url: string, body: unknown): Request {
  return new Request(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
}

describe("tri-readable api contracts", () => {
  let previousSettings: string | null = null;
  let dbPath = "";

  beforeEach(() => {
    previousSettings = snapshotSettings();
    dbPath = createFixtureDb("khal-tri-readable-", "KHAL-tri-readable.sqlite");
    writeFixtureSettings(dbPath);
  });

  afterEach(() => {
    restoreSettings(previousSettings);
    cleanupFixtureDb(dbPath);
  });

  it("keeps evaluate deterministic for same input and persists override audit", async () => {
    const request = {
      mode: "domain" as const,
      targetId: "domain-economic-power",
      role: "MISSIONARY" as const,
      noRuinGate: true
    };
    const first = await evaluatePost(postJson("http://localhost/api/decision/evaluate", request));
    const second = await evaluatePost(postJson("http://localhost/api/decision/evaluate", request));
    const firstJson = await first.json();
    const secondJson = await second.json();
    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(secondJson.readinessScore).toBe(firstJson.readinessScore);
    expect(secondJson.blockReasons).toEqual(firstJson.blockReasons);

    const overrideResponse = await overridePost(
      postJson("http://localhost/api/decision/override", {
        mode: "domain",
        targetId: "domain-economic-power",
        guardIds: ["G1_COMPLEX_MONOMODAL"],
        overrideReason: "Operator approved exception for controlled experiment",
        operator: "uat-operator"
      })
    );
    const overrideJson = await overrideResponse.json();
    expect(overrideResponse.status).toBe(201);
    expect(Array.isArray(overrideJson.guardIds)).toBe(true);

    const db = new Database(dbPath, { readonly: true });
    try {
      const countRow = db.prepare("SELECT COUNT(*) AS count FROM decision_overrides").get() as { count: number };
      expect(countRow.count).toBe(1);
    } finally {
      db.close();
    }
  });

  it("rejects commit mutations that were not proposed in dry-run", async () => {
    const dryRunResponse = await dryRunPost(
      postJson("http://localhost/api/agent/wargame/dry-run", {
        mode: "interest",
        targetId: "domain-economic-power",
        prompt: "war game this interest and queue execution",
        role: "VISIONARY",
        noRuinGate: true
      })
    );
    const dryRunJson = await dryRunResponse.json();
    expect(dryRunResponse.status).toBe(201);
    expect(Array.isArray(dryRunJson.proposedMutations)).toBe(true);

    const commitResponse = await commitPost(
      postJson("http://localhost/api/agent/wargame/commit", {
        dryRunId: dryRunJson.id,
        acceptedMutations: [
          {
            kind: "CREATE_TASK",
            payload: {
              id: "11111111-1111-1111-1111-111111111111",
              title: "Injected mutation",
              sourceType: "PLAN",
              sourceId: "mission-global"
            }
          }
        ],
        mode: "interest",
        targetId: "domain-economic-power",
        role: "VISIONARY",
        noRuinGate: true
      })
    );
    const commitJson = await commitResponse.json();
    expect(commitResponse.status).toBe(400);
    expect(String(commitJson.error)).toContain("subset of dry-run proposals");

    const db = new Database(dbPath, { readonly: true });
    try {
      const row = db.prepare("SELECT status FROM agent_dry_runs WHERE id=?").get(dryRunJson.id) as { status: string };
      expect(row.status).toBe("PENDING");
    } finally {
      db.close();
    }
  });

  it("commits a valid dry-run subset and marks row committed", async () => {
    const dryRunResponse = await dryRunPost(
      postJson("http://localhost/api/agent/wargame/dry-run", {
        mode: "interest",
        targetId: "domain-economic-power",
        prompt: "war game this interest and queue execution",
        role: "VISIONARY",
        noRuinGate: true
      })
    );
    const dryRunJson = await dryRunResponse.json();
    expect(dryRunResponse.status).toBe(201);
    const acceptedMutations = (dryRunJson.proposedMutations as Array<Record<string, unknown>>).slice(0, 1);
    expect(acceptedMutations.length).toBe(1);

    const commitResponse = await commitPost(
      postJson("http://localhost/api/agent/wargame/commit", {
        dryRunId: dryRunJson.id,
        acceptedMutations,
        mode: "interest",
        targetId: "domain-economic-power",
        role: "VISIONARY",
        noRuinGate: true
      })
    );
    const commitJson = await commitResponse.json();
    expect(commitResponse.status).toBe(200);
    expect(commitJson.commitResult.committedCount).toBe(1);

    const db = new Database(dbPath, { readonly: true });
    try {
      const row = db.prepare("SELECT status FROM agent_dry_runs WHERE id=?").get(dryRunJson.id) as { status: string };
      expect(row.status).toBe("COMMITTED");
    } finally {
      db.close();
    }
  });

  it("returns deterministic triage snapshot for same input", async () => {
    const request = {
      mode: "domain" as const,
      targetId: "domain-economic-power",
      role: "MISSIONARY" as const,
      noRuinGate: true
    };
    const first = await triagePost(postJson("http://localhost/api/decision/triage", request));
    const second = await triagePost(postJson("http://localhost/api/decision/triage", request));
    const firstJson = await first.json();
    const secondJson = await second.json();
    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(firstJson.suggestions).toEqual(secondJson.suggestions);
  });

  it("applies whitelisted quick action and returns fresh evaluation", async () => {
    const actionResponse = await quickActionPost(
      postJson("http://localhost/api/decision/quick-action", {
        kind: "SET_DOMAIN_BIMODAL_POSTURE_TEMPLATE",
        targetRef: { mode: "domain", targetId: "domain-economic-power" },
        payload: {
          hedgeText: "Protect downside via robust baseline.",
          edgeText: "Expose to asymmetric upside via capped bets."
        },
        role: "MISSIONARY",
        noRuinGate: true
      })
    );
    const actionJson = await actionResponse.json();
    expect(actionResponse.status).toBe(200);
    expect(actionJson.applied).toBe(true);
    expect(actionJson.evaluation).toBeTruthy();
  });
});
