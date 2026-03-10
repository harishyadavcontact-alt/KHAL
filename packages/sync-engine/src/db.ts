import Database from "better-sqlite3";
import { initDatabase, resolveDbPath } from "@khal/sqlite-core";

export function openDb(inputPath: string): Database.Database {
  const dbPath = resolveDbPath(inputPath);
  initDatabase(dbPath);
  return new Database(dbPath);
}

export function ensureDomain(db: Database.Database, domainId: string): void {
  const existing = db.prepare("SELECT id FROM domains WHERE id=?").get(domainId) as { id: string } | undefined;
  if (existing) return;
  db.prepare("INSERT INTO domains (id, code, name, description) VALUES (?, ?, ?, ?)").run(
    domainId,
    domainId,
    domainId.replace(/-/g, " "),
    "Auto-created domain"
  );
}
