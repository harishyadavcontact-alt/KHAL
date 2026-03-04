import { mkdtempSync, utimesSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import { initDatabase } from "@khal/sqlite-core";
import { loadState, writeAffair, writeInterest, writeTask } from "../src/index";

function fixtureDb(): string {
  const tempDir = mkdtempSync(path.join(tmpdir(), "khal-sync-db-"));
  const dbPath = path.join(tempDir, "KHAL-test.sqlite");
  initDatabase(dbPath);
  return dbPath;
}

describe("sync engine integration", () => {
  it("persists affair and returns it in state", () => {
    const dbPath = fixtureDb();
    const created = writeAffair(dbPath, {
      id: randomUUID(),
      title: "Integration Affair",
      domainId: "integration",
      stakes: 6,
      risk: 7,
      completionPct: 0
    });

    const loaded = loadState(dbPath);
    expect(loaded.state.affairs.some((item) => item.id === created.id)).toBe(true);
  });

  it("persists interest and affects optionality", () => {
    const dbPath = fixtureDb();
    writeInterest(dbPath, {
      id: randomUUID(),
      title: "Integration Interest",
      domainId: "integration",
      stakes: 5,
      risk: 4,
      convexity: 8
    });

    const loaded = loadState(dbPath);
    expect(loaded.dashboard.optionalityIndex).toBeGreaterThan(0);
  });

  it("persists lab experiment fields on interest create/update", () => {
    const dbPath = fixtureDb();
    const id = randomUUID();
    writeInterest(dbPath, {
      id,
      title: "Lab Interest",
      domainId: "integration",
      stakes: 6,
      risk: 4,
      convexity: 8,
      labStage: "FORGE",
      hypothesis: "Convexity rises with bounded downside",
      maxLossPct: 20,
      expiryDate: "2099-01-01T00:00:00.000Z",
      killCriteria: ["No positive signal by expiry"],
      hedgePct: 80,
      edgePct: 20,
      irreversibility: 30,
      evidenceNote: "Initial baseline"
    });
    writeInterest(dbPath, {
      id,
      title: "Lab Interest Updated",
      domainId: "integration",
      labStage: "WIELD",
      hypothesis: "Updated hypothesis",
      maxLossPct: 15,
      killCriteria: ["Stop on drawdown breach"],
      hedgePct: 85,
      edgePct: 15
    });

    const loaded = loadState(dbPath);
    const interest = loaded.state.interests.find((item) => item.id === id);
    expect(interest?.labStage).toBe("WIELD");
    expect(interest?.maxLossPct).toBe(15);
    expect(interest?.killCriteria?.length).toBe(1);
    expect(interest?.hedgePct).toBe(85);
    expect(interest?.edgePct).toBe(15);
  });

  it("blocks task done transition if dependencies not done", () => {
    const dbPath = fixtureDb();
    const loaded = loadState(dbPath);

    expect(() =>
      writeTask(
        dbPath,
        {
          id: randomUUID(),
          title: "Blocked Task",
          sourceType: "AFFAIR",
          sourceId: "integration",
          status: "DONE",
          dependencyIds: ["missing-task"]
        },
        loaded.state.tasks
      )
    ).toThrow(/dependencies/i);
  });

  it("requires refresh on stale db write", () => {
    const dbPath = fixtureDb();
    const loaded = loadState(dbPath);

    const now = new Date();
    utimesSync(dbPath, now, new Date(now.getTime() + 2000));

    expect(() =>
      writeAffair(
        dbPath,
        {
          id: randomUUID(),
          title: "Stale Affair"
        },
        loaded.sync.modifiedAt
      )
    ).toThrow(/refresh/i);
  });

  it("computes decision acceleration fields on dashboard", () => {
    const dbPath = fixtureDb();
    writeAffair(dbPath, {
      id: randomUUID(),
      title: "Critical Fragility",
      domainId: "integration",
      stakes: 9,
      risk: 9,
      completionPct: 10
    });
    writeInterest(dbPath, {
      id: randomUUID(),
      title: "Convex Bet",
      domainId: "integration",
      stakes: 7,
      risk: 3,
      convexity: 8
    });

    const loaded = loadState(dbPath);
    expect(loaded.dashboard.virtueSpiral.stage).toBeDefined();
    expect(typeof loaded.dashboard.pathComparator.delta).toBe("number");
    expect(loaded.dashboard.copilot.ctaPayload.title.length).toBeGreaterThan(0);
    expect(loaded.dashboard.decisionAccelerationMeta.computedAtIso.length).toBeGreaterThan(0);
    expect(["HIGH", "MEDIUM", "LOW"]).toContain(loaded.dashboard.decisionAccelerationMeta.dataQuality);
    expect(["NOMINAL", "WATCH", "CRITICAL"]).toContain(loaded.dashboard.decisionAccelerationMeta.protocolState);
    expect(loaded.dashboard.tripwire.state).toBeDefined();
    expect(Array.isArray(loaded.dashboard.ruinLedger)).toBe(true);
    expect(Array.isArray(loaded.dashboard.violationFeed)).toBe(true);
    expect(Array.isArray(loaded.dashboard.fragilityTimeline)).toBe(true);
    expect(Array.isArray(loaded.dashboard.decisionReplay)).toBe(true);
  });

  it("marks spiral down trend under high fragility and weak execution", () => {
    const dbPath = fixtureDb();
    writeAffair(dbPath, {
      id: randomUUID(),
      title: "High Fragility Affair",
      domainId: "integration",
      stakes: 10,
      risk: 10,
      completionPct: 0
    });
    writeTask(dbPath, {
      id: randomUUID(),
      title: "Not done task",
      sourceType: "AFFAIR",
      sourceId: "integration",
      status: "NOT_STARTED",
      dependencyIds: []
    }, []);

    const loaded = loadState(dbPath);
    expect(loaded.dashboard.virtueSpiral.trend).toBe("DOWN");
  });

  it("marks spiral up trend when fragility is reduced and execution is healthy", () => {
    const dbPath = fixtureDb();
    const affairId = randomUUID();
    writeAffair(dbPath, {
      id: affairId,
      title: "Reduced Fragility Affair",
      domainId: "integration",
      stakes: 3,
      risk: 2,
      completionPct: 95,
      status: "DONE"
    });
    writeInterest(dbPath, {
      id: randomUUID(),
      title: "Strong Convexity Interest",
      domainId: "integration",
      stakes: 10,
      risk: 3,
      convexity: 10,
      status: "IN_PROGRESS"
    });

    const doneTask = writeTask(
      dbPath,
      {
        id: randomUUID(),
        title: "Completed task",
        sourceType: "AFFAIR",
        sourceId: affairId,
        status: "DONE",
        dependencyIds: []
      },
      []
    );
    writeTask(
      dbPath,
      {
        id: randomUUID(),
        title: "In progress task",
        sourceType: "PLAN",
        sourceId: doneTask.id,
        status: "IN_PROGRESS",
        dependencyIds: []
      },
      [doneTask]
    );

    const loaded = loadState(dbPath);
    expect(["UP", "STABLE"]).toContain(loaded.dashboard.virtueSpiral.trend);
    expect(loaded.dashboard.virtueSpiral.score).toBeGreaterThan(40);
  });

  it("falls back to safe copilot payload when ranked source id is invalid", () => {
    const dbPath = fixtureDb();
    writeAffair(dbPath, {
      id: "",
      title: "Invalid Id Affair",
      domainId: "integration",
      stakes: 10,
      risk: 10,
      completionPct: 0,
      status: "NOT_STARTED"
    });

    const loaded = loadState(dbPath);
    expect(loaded.dashboard.decisionAccelerationMeta.fallbackUsed).toBe(true);
    expect(loaded.dashboard.copilot.ctaPayload.sourceId).toBe("mission-global");
  });

  it("moves tripwire to BLOCK under severe ruin pressure", () => {
    const dbPath = fixtureDb();
    writeAffair(dbPath, {
      id: randomUUID(),
      title: "Severe fragility affair",
      domainId: "integration",
      stakes: 10,
      risk: 10,
      completionPct: 0,
      status: "NOT_STARTED"
    });
    writeAffair(dbPath, {
      id: randomUUID(),
      title: "Second severe fragility affair",
      domainId: "integration",
      stakes: 10,
      risk: 10,
      completionPct: 0,
      status: "NOT_STARTED"
    });
    const loaded = loadState(dbPath);
    expect(["WATCH", "BLOCK"]).toContain(loaded.dashboard.tripwire.state);
  });
});
