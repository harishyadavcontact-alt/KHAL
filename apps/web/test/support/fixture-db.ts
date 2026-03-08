import { existsSync, mkdtempSync, readFileSync, rmSync, unlinkSync, writeFileSync } from "node:fs";
import path from "node:path";
import { tmpdir } from "node:os";
import { initDatabase } from "@khal/sqlite-core";

export const SETTINGS_PATH = path.resolve(process.cwd(), "..", "..", ".khal.local.json");

export function snapshotSettings() {
  return existsSync(SETTINGS_PATH) ? readFileSync(SETTINGS_PATH, "utf-8") : null;
}

export function restoreSettings(previousSettings: string | null) {
  if (previousSettings === null) {
    if (existsSync(SETTINGS_PATH)) unlinkSync(SETTINGS_PATH);
    return;
  }
  writeFileSync(SETTINGS_PATH, previousSettings, "utf-8");
}

export function createFixtureDb(prefix: string, filename = "KHAL-test.sqlite") {
  const tempDir = mkdtempSync(path.join(tmpdir(), prefix));
  const dbPath = path.join(tempDir, filename);
  initDatabase(dbPath);
  return dbPath;
}

export function writeFixtureSettings(dbPath: string) {
  writeFileSync(SETTINGS_PATH, JSON.stringify({ dbPath }, null, 2), "utf-8");
}

export function cleanupFixtureDb(dbPath: string) {
  rmSync(path.dirname(dbPath), { recursive: true, force: true });
}
