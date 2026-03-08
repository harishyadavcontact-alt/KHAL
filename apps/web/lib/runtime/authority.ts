import type Database from "better-sqlite3";
import { loadState, type LoadedState } from "@khal/sync-engine";
import { evaluateRuntimeInvariants, type RuntimeInvariantReport } from "./invariants";

export interface RuntimeOwnershipEntry {
  entity: string;
  writeAuthority: string;
  readAuthority: "canonical_sqlite" | "sqlite_projection";
  notes: string;
}

export interface RuntimeProjection extends LoadedState {
  runtimeInvariants: RuntimeInvariantReport;
  ownership: RuntimeOwnershipEntry[];
}

export const RUNTIME_OWNERSHIP: RuntimeOwnershipEntry[] = [
  { entity: "laws/domains", writeAuthority: "apps/web/lib/api.ts + SQLite tables", readAuthority: "canonical_sqlite", notes: "Map backbone and volatility hierarchy." },
  { entity: "affairs/interests/tasks", writeAuthority: "@khal/sync-engine write* helpers + SQLite", readAuthority: "sqlite_projection", notes: "Operational entities remain SQLite-backed through the sync-engine projection." },
  { entity: "drafts/promotions", writeAuthority: "apps/web/lib/drafts/store.ts", readAuthority: "canonical_sqlite", notes: "Draft runtime tables are canonical and not Excel-backed." },
  { entity: "knowledge primitives", writeAuthority: "apps/web/lib/api.ts + drafts promotion flow", readAuthority: "canonical_sqlite", notes: "Craft knowledge graph is canonical in SQLite." },
  { entity: "lineage/doctrine/plans", writeAuthority: "apps/web/lib/api.ts + apps/web/lib/api/*.ts", readAuthority: "canonical_sqlite", notes: "Decision support overlays read directly from SQLite." }
] as const;

export function loadRuntimeProjection(args: { dbPath: string; db?: Database.Database }): RuntimeProjection {
  const loaded = loadState(args.dbPath);
  return {
    ...loaded,
    runtimeInvariants: evaluateRuntimeInvariants({ dbPath: args.dbPath, db: args.db, state: loaded.state }),
    ownership: [...RUNTIME_OWNERSHIP]
  };
}
