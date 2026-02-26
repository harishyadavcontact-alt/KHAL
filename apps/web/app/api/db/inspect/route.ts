import { NextResponse } from "next/server";
import Database from "better-sqlite3";
import { existsSync, statSync } from "node:fs";
import { readSettings } from "../../../../lib/settings";

export const runtime = "nodejs";

export async function GET() {
  const settings = await readSettings();
  const dbPath = settings.dbPath;

  const result: Record<string, unknown> = {
    dbPath,
    exists: existsSync(dbPath)
  };

  if (!existsSync(dbPath)) {
    return NextResponse.json(result, { status: 404 });
  }

  const stat = statSync(dbPath);
  result.sizeBytes = stat.size;
  result.modifiedAt = stat.mtime.toISOString();

  const db = new Database(dbPath, { readonly: true });
  try {
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all() as Array<{ name: string }>;
    const tableStats = tables.map((t) => ({
      name: t.name,
      rows: Number((db.prepare(`SELECT COUNT(*) as c FROM ${t.name}`).get() as { c: number }).c)
    }));

    result.tables = tableStats;

    const warRoomPreview = db.prepare(
      "SELECT sort_order, volatility_law, domain, stakes, risks FROM war_room_matrix_rows ORDER BY sort_order LIMIT 20"
    ).all();
    result.warRoomPreview = warRoomPreview;
  } finally {
    db.close();
  }

  return NextResponse.json(result);
}