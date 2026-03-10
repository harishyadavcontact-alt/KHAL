import { randomUUID } from "node:crypto";
import Database from "better-sqlite3";
import { z } from "zod";
import { initDatabase } from "@khal/sqlite-core";
import { ensureOperatorDb } from "../operator-db";
import { readSettings, writeSettings } from "../settings";
import { ok, withDb, type AnyRow } from "./shared";

const DEFAULT_USER_KEY = "default_operator";

const bootstrapSchema = z.object({
  name: z.string().min(1),
  dobIso: z.string().min(1),
  lifeExpectancyYears: z.number().int().min(1).max(130).default(80),
  volatilitySources: z.array(z.string().min(1)).default([])
});

function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 32) || randomUUID().slice(0, 8);
}

function ensureTimeHorizonProfile(db: Database.Database, userKey: string) {
  const existing = db.prepare("SELECT user_key FROM time_horizon_profiles WHERE user_key=?").get(userKey) as { user_key: string } | undefined;
  if (existing) return;
  db.prepare(
    "INSERT INTO time_horizon_profiles (user_key, focus_text, dob_iso, life_expectancy_years) VALUES (?, ?, ?, ?)"
  ).run(userKey, "define your north star", "2002-09-30T00:00:00.000Z", 80);
}

export function readOperatorProfile(db: Database.Database) {
  const profile = db.prepare("SELECT * FROM time_horizon_profiles WHERE user_key=?").get(DEFAULT_USER_KEY) as AnyRow | undefined;
  const nameRow = db.prepare("SELECT value FROM meta_kv WHERE key='operator_name'").get() as AnyRow | undefined;
  const completedRow = db.prepare("SELECT value FROM meta_kv WHERE key='operator_onboarding_completed'").get() as AnyRow | undefined;

  return {
    onboarded: String(completedRow?.value ?? "0") === "1" && Boolean(nameRow?.value),
    user: {
      name: nameRow?.value ? String(nameRow.value) : "Operator",
      birthDate: profile?.dob_iso ? String(profile.dob_iso) : "2002-09-30T00:00:00.000Z",
      lifeExpectancy: Number(profile?.life_expectancy_years ?? 80),
      location: "Unknown"
    }
  };
}

export async function handleOperatorBootstrapGet() {
  return withDb((db) => ok(readOperatorProfile(db)));
}

export async function handleOperatorBootstrapPost(rawBody: unknown) {
  const parsed = bootstrapSchema.parse(rawBody);
  const settings = await readSettings();
  const dbPath = await ensureOperatorDb({
    name: parsed.name.trim(),
    sourceDbPath: settings.dbPath
  });
  if (dbPath !== settings.dbPath) {
    await writeSettings({ dbPath });
  }

  initDatabase(dbPath);
  const db = new Database(dbPath);
  try {
    ensureTimeHorizonProfile(db, DEFAULT_USER_KEY);
    db.prepare(
      `UPDATE time_horizon_profiles
       SET dob_iso=?, life_expectancy_years=?, updated_at=datetime('now')
       WHERE user_key=?`
    ).run(parsed.dobIso, parsed.lifeExpectancyYears, DEFAULT_USER_KEY);

    db.prepare(
      `INSERT INTO meta_kv(key, value) VALUES('operator_name', ?)
       ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=datetime('now')`
    ).run(parsed.name.trim());
    db.prepare(
      `INSERT INTO meta_kv(key, value) VALUES('operator_onboarding_completed', '1')
       ON CONFLICT(key) DO UPDATE SET value='1', updated_at=datetime('now')`
    ).run();

    const createdSourceIds: string[] = [];
    const existingNames = new Set(
      (db.prepare("SELECT name FROM volatility_sources").all() as AnyRow[]).map((row) => String(row.name).toLowerCase())
    );
    let sortOrder =
      Number((db.prepare("SELECT COALESCE(MAX(sort_order), 0) AS max_sort FROM volatility_sources").get() as AnyRow)?.max_sort ?? 0);

    for (const rawSource of parsed.volatilitySources) {
      const name = rawSource.trim();
      if (!name) continue;
      if (existingNames.has(name.toLowerCase())) {
        const existing = db.prepare("SELECT id FROM volatility_sources WHERE lower(name)=lower(?)").get(name) as AnyRow | undefined;
        if (existing?.id) createdSourceIds.push(String(existing.id));
        continue;
      }
      sortOrder += 1;
      const id = `src-${slugify(name)}-${sortOrder}`;
      const code = slugify(name).replace(/-/g, "_").toUpperCase().slice(0, 24);
      db.prepare("INSERT INTO volatility_sources (id, code, name, sort_order) VALUES (?, ?, ?, ?)").run(id, code, name, sortOrder);
      existingNames.add(name.toLowerCase());
      createdSourceIds.push(id);
    }

    return ok({
      onboarded: true,
      user: {
        name: parsed.name.trim(),
        birthDate: parsed.dobIso,
        lifeExpectancy: parsed.lifeExpectancyYears,
        location: "Unknown"
      },
      firstSourceId: createdSourceIds[0] ?? null,
      createdSourceIds
    }, 201);
  } finally {
    db.close();
  }
}
