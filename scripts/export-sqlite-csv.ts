import Database from "better-sqlite3";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

function csvEscape(value: unknown): string {
  if (value == null) return "";
  const text = String(value);
  if (text.includes(",") || text.includes("\n") || text.includes("\"")) {
    return `"${text.replace(/\"/g, '""')}"`;
  }
  return text;
}

const dbPath = path.resolve(process.argv[2] ?? path.resolve("data", "KHAL.sqlite"));
const outDir = path.resolve(process.argv[3] ?? path.resolve("exports", "csv"));

const db = new Database(dbPath, { readonly: true });

try {
  mkdirSync(outDir, { recursive: true });

  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all() as Array<{ name: string }>;

  for (const table of tables) {
    const rows = db.prepare(`SELECT * FROM ${table.name}`).all() as Array<Record<string, unknown>>;
    const headers = rows.length > 0 ? Object.keys(rows[0]) : [];
    const lines: string[] = [];

    if (headers.length > 0) {
      lines.push(headers.join(","));
      for (const row of rows) {
        lines.push(headers.map((h) => csvEscape(row[h])).join(","));
      }
    }

    writeFileSync(path.join(outDir, `${table.name}.csv`), lines.join("\n"), "utf-8");
  }

  console.log(JSON.stringify({ ok: true, dbPath, outDir, tables: tables.length }, null, 2));
} finally {
  db.close();
}