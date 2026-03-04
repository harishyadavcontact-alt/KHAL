import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { existsSync, mkdtempSync, readFileSync, rmSync, unlinkSync, writeFileSync } from "node:fs";
import path from "node:path";
import { tmpdir } from "node:os";
import { initDatabase } from "@khal/sqlite-core";
import { handleData, handleMissionHierarchyGet, handleMissionHierarchyPut } from "../lib/api";
import { isWarGameRouteMode, parseWarGameRouteMode } from "../lib/war-room/route-mode";
import type { AppData } from "../components/war-room-v2/types";
import {
  CANONICAL_VOLATILITY_SLOTS,
  EXPECTED_WARGAME_MODES,
  classifyAffairLane,
  classifyInterestLane,
  deterministicHierarchySort,
  evaluateDirectionalCompatibility,
  groupLineageRisksBySourceAndDomain,
  mapSourceLabelToSlot,
  parseRoutesFromSmokeScript,
  projectDomainsToVolatilitySlots
} from "./decision-compatibility.fixture";

const SETTINGS_PATH = path.resolve(process.cwd(), "..", "..", ".khal.local.json");

function writeSettings(dbPath: string) {
  writeFileSync(SETTINGS_PATH, JSON.stringify({ dbPath }, null, 2), "utf-8");
}

function fixtureDb(): string {
  const tempDir = mkdtempSync(path.join(tmpdir(), "khal-decision-compat-"));
  const dbPath = path.join(tempDir, "KHAL-decision-compat.sqlite");
  initDatabase(dbPath);
  return dbPath;
}

async function loadAppData(): Promise<AppData> {
  const response = await handleData();
  return (await response.json()) as AppData;
}

describe.sequential("khal decision compatibility (directional gate)", () => {
  let previousSettings: string | null = null;
  let dbPath = "";

  beforeEach(() => {
    previousSettings = existsSync(SETTINGS_PATH) ? readFileSync(SETTINGS_PATH, "utf-8") : null;
    dbPath = fixtureDb();
    writeSettings(dbPath);
  });

  afterEach(() => {
    if (previousSettings === null) {
      if (existsSync(SETTINGS_PATH)) unlinkSync(SETTINGS_PATH);
    } else {
      writeFileSync(SETTINGS_PATH, previousSettings, "utf-8");
    }
    try {
      rmSync(path.dirname(dbPath), { recursive: true, force: true, maxRetries: 8, retryDelay: 120 });
    } catch {
      // Best effort cleanup on Windows file handle lag.
    }
  });

  it("maps canonical volatility slots with legacy alias support", () => {
    expect(CANONICAL_VOLATILITY_SLOTS).toHaveLength(6);
    expect(CANONICAL_VOLATILITY_SLOTS.map((slot) => slot.key)).toEqual([
      "universe",
      "nature",
      "nurture",
      "land",
      "time",
      "law6"
    ]);
    expect(mapSourceLabelToSlot("Laws of Physics")).toBe("universe");
    expect(mapSourceLabelToSlot("Law of Jungle")).toBe("law6");
    expect(mapSourceLabelToSlot("Law 6 (TBD)")).toBe("law6");
  });

  it("sorts hierarchy deterministically top-to-bottom then left-to-right", () => {
    const sorted = deterministicHierarchySort([
      { id: "n4", layerDepth: 2, slotKey: "land", sortOrder: 1 },
      { id: "n2", layerDepth: 1, slotKey: "time", sortOrder: 1 },
      { id: "n1", layerDepth: 1, slotKey: "universe", sortOrder: 2 },
      { id: "n3", layerDepth: 1, slotKey: "universe", sortOrder: 1 },
      { id: "n9", layerDepth: 1, slotKey: "universe", sortOrder: 1, lexicalKey: "beta" },
      { id: "n0", layerDepth: 1, slotKey: "universe", sortOrder: 1, lexicalKey: "alpha" }
    ]);

    expect(sorted.map((node) => node.id)).toEqual(["n0", "n9", "n3", "n1", "n2", "n4"]);
  });

  it("passes directional hard invariants on runtime app data", async () => {
    const appData = await loadAppData();
    const projections = projectDomainsToVolatilitySlots(appData);
    expect(projections).toHaveLength(appData.domains.length);

    const report = evaluateDirectionalCompatibility(appData);
    expect(report.hardFailures).toEqual([]);
    expect(Array.isArray(report.warnings)).toBe(true);
    expect(report.compatibilitySummary.totalChecks).toBeGreaterThan(0);
    expect(report.compatibilitySummary.hardFailureCount).toBe(0);

    for (const affair of appData.affairs) {
      expect(classifyAffairLane(affair)).toBe("obligation");
    }
    for (const interest of appData.interests) {
      expect(classifyInterestLane(interest)).toBe("optionality");
    }
  });

  it("enforces exact war-gaming mode contract", () => {
    for (const mode of EXPECTED_WARGAME_MODES) {
      expect(isWarGameRouteMode(mode)).toBe(true);
      expect(parseWarGameRouteMode(mode)).toBe(mode);
    }

    for (const invalid of ["world", "domains", "affairs", "mission-command", "lineages"]) {
      expect(isWarGameRouteMode(invalid)).toBe(false);
      expect(parseWarGameRouteMode(invalid)).toBeNull();
    }
  });

  it("keeps smoke-route contract aligned with canonical operational routes", () => {
    const smokeScriptPath = path.resolve(process.cwd(), "..", "..", "scripts", "smoke-routes-3010.ps1");
    const routes = parseRoutesFromSmokeScript(readFileSync(smokeScriptPath, "utf-8"));

    for (const mode of EXPECTED_WARGAME_MODES) {
      expect(routes).toContain(`/war-gaming/${mode}`);
    }
    expect(routes).toContain("/war-room");
    expect(routes).toContain("/dashboard");
    expect(routes).toContain("/missionCommand");
    expect(routes).toContain("/source-of-volatility");
    expect(routes).toContain("/maya");
    expect(routes).toContain("/lab");
  });

  it("round-trips mission hierarchy while preserving parent/dependency integrity", async () => {
    const missionId = "mission-compat-check";
    const putResponse = await handleMissionHierarchyPut(missionId, {
      nodes: [
        { id: "node-source", refType: "SOURCE", refId: "source-law-time", sortOrder: 20, dependencyIds: [] },
        { id: "node-domain", refType: "DOMAIN", refId: "domain-finance", parentNodeId: "node-source", sortOrder: 30, dependencyIds: ["node-source"] },
        { id: "node-affair", refType: "AFFAIR", refId: "affair-hedge", parentNodeId: "node-domain", sortOrder: 40, dependencyIds: ["node-domain"] }
      ]
    });
    expect(putResponse.status).toBe(200);

    const getResponse = await handleMissionHierarchyGet(missionId);
    expect(getResponse.status).toBe(200);
    const payload = (await getResponse.json()) as {
      nodes: Array<{ id: string; parentNodeId?: string; sortOrder: number }>;
      dependencies: Array<{ missionNodeId: string; dependsOnNodeId: string }>;
    };

    const nodeIds = new Set(payload.nodes.map((node) => node.id));
    const rootId = `mission-root-${missionId}`;

    for (const node of payload.nodes) {
      if (!node.parentNodeId) continue;
      expect(node.parentNodeId === rootId || nodeIds.has(node.parentNodeId)).toBe(true);
    }

    for (const dependency of payload.dependencies) {
      expect(nodeIds.has(dependency.missionNodeId)).toBe(true);
      expect(nodeIds.has(dependency.dependsOnNodeId)).toBe(true);
    }

    const sortOrders = payload.nodes.map((node) => node.sortOrder);
    const sortedSortOrders = [...sortOrders].sort((left, right) => left - right);
    expect(sortOrders).toEqual(sortedSortOrders);
  });

  it("supports lineage exposure grouping by source and by domain", async () => {
    const appData = await loadAppData();
    const { bySource, byDomain } = groupLineageRisksBySourceAndDomain(appData.lineageRisks ?? []);
    const groupedCount =
      [...bySource.values()].reduce((sum, bucket) => sum + bucket.length, 0);
    expect(groupedCount).toBe((appData.lineageRisks ?? []).length);

    const selfNodeIds = new Set((appData.lineages?.nodes ?? []).filter((node) => node.level === "SELF").map((node) => node.id));
    const familyNodeIds = new Set((appData.lineages?.nodes ?? []).filter((node) => node.level === "FAMILY").map((node) => node.id));
    const overlap = [...selfNodeIds].filter((id) => familyNodeIds.has(id));
    expect(overlap).toEqual([]);

    expect(bySource instanceof Map).toBe(true);
    expect(byDomain instanceof Map).toBe(true);
  });
});
