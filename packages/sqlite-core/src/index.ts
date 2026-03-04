import { existsSync, mkdirSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Database from "better-sqlite3";

export interface DbInitResult {
  dbPath: string;
  created: boolean;
}

export function resolveDbPath(inputPath?: string): string {
  if (inputPath) return path.resolve(inputPath);
  return path.resolve(process.cwd(), "data", "KHAL.sqlite");
}

export function initDatabase(dbPathInput?: string): DbInitResult {
  const dbPath = resolveDbPath(dbPathInput);
  const dir = path.dirname(dbPath);
  mkdirSync(dir, { recursive: true });

  const created = !existsSync(dbPath);
  const db = new Database(dbPath);

  try {
    db.exec(
      `CREATE TABLE IF NOT EXISTS schema_migrations (
         name TEXT PRIMARY KEY,
         applied_at TEXT NOT NULL DEFAULT (datetime('now'))
       )`
    );

    const thisDir = path.dirname(fileURLToPath(import.meta.url));
    const migrationsDir = path.resolve(thisDir, "..", "migrations");
    const migrationFiles = readdirSync(migrationsDir)
      .filter((name) => name.endsWith(".sql"))
      .sort((a, b) => a.localeCompare(b));

    for (const file of migrationFiles) {
      const applied = db.prepare("SELECT name FROM schema_migrations WHERE name=?").get(file) as { name: string } | undefined;
      if (applied) continue;
      const migrationPath = path.resolve(migrationsDir, file);
      const sql = readFileSync(migrationPath, "utf-8");
      try {
        db.exec(sql);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        if (!message.toLowerCase().includes("duplicate column name")) {
          throw error;
        }
      }
      db.prepare("INSERT OR IGNORE INTO schema_migrations(name, applied_at) VALUES(?, datetime('now'))").run(file);
    }

    const latestMigration = migrationFiles[migrationFiles.length - 1] ?? "0000_init.sql";
    db.prepare("INSERT INTO meta_kv(key, value) VALUES(?, ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=datetime('now')")
      .run("schema_version", latestMigration.replace(/\.sql$/, ""));
    db.prepare("INSERT INTO meta_kv(key, value) VALUES(?, ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=datetime('now')")
      .run("source_of_truth", "sqlite");
  } finally {
    db.close();
  }

  return { dbPath, created };
}
