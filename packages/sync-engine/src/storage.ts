import { statSync } from "node:fs";
import { initDatabase, resolveDbPath } from "@khal/sqlite-core";
import type { LoadedState } from "./types";
import { loadState } from "./index";

export function detectConflict(dbPathInput: string, lastSeenModifiedAt: string): boolean {
  const dbPath = resolveDbPath(dbPathInput);
  if (!statSync(dbPath, { throwIfNoEntry: false })) return false;
  const modifiedAt = statSync(dbPath).mtime.toISOString();
  return Boolean(lastSeenModifiedAt) && modifiedAt > lastSeenModifiedAt;
}

export function refreshIfStale(dbPathInput: string): LoadedState {
  return loadState(dbPathInput);
}

export function normalize(dbPathInput: string): { ok: boolean; issues: string[] } {
  initDatabase(resolveDbPath(dbPathInput));
  return { ok: true, issues: [] };
}
