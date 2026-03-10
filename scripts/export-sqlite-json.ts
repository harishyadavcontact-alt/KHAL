import Database from "better-sqlite3";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

function resolveDefaultDbPath() {
  const settingsPath = path.resolve(".khal.local.json");
  if (existsSync(settingsPath)) {
    try {
      const parsed = JSON.parse(readFileSync(settingsPath, "utf-8")) as { dbPath?: string };
      if (parsed.dbPath) return path.resolve(parsed.dbPath);
    } catch {
      // ignore and fallback
    }
  }
  return path.resolve("data", "KHAL.sqlite");
}

const dbPath = path.resolve(process.argv[2] ?? resolveDefaultDbPath());
const outPath = path.resolve(process.argv[3] ?? path.resolve("exports", "khal-export.json"));

const db = new Database(dbPath, { readonly: true });

try {
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all() as Array<{ name: string }>;
  const payload: Record<string, unknown[]> = {};

  for (const table of tables) {
    payload[table.name] = db.prepare(`SELECT * FROM ${table.name}`).all() as unknown[];
  }

  mkdirSync(path.dirname(outPath), { recursive: true });
  writeFileSync(outPath, JSON.stringify(payload, null, 2), "utf-8");
  console.log(JSON.stringify({ ok: true, dbPath, outPath, tables: tables.length }, null, 2));
} finally {
  db.close();
}
