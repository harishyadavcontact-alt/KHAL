import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import Database from "better-sqlite3";
import { z } from "zod";
import { ok, withDb, type AnyRow } from "./shared";

const timeHorizonProfileSchema = z.object({
  focusText: z.string().optional(),
  dobIso: z.string().optional(),
  lifeExpectancyYears: z.number().int().min(1).max(130).optional()
});

const timeHorizonDeadlineCreateSchema = z.object({
  label: z.string().min(1),
  dueAt: z.string().min(1)
});

const timeHorizonDeadlineUpdateSchema = z.object({
  label: z.string().min(1).optional(),
  dueAt: z.string().min(1).optional(),
  sortOrder: z.number().int().optional()
});

function ensureTimeHorizonProfile(db: Database.Database, userKey: string) {
  const existing = db.prepare("SELECT user_key FROM time_horizon_profiles WHERE user_key=?").get(userKey) as { user_key: string } | undefined;
  if (existing) return;
  db.prepare(
    "INSERT INTO time_horizon_profiles (user_key, focus_text, dob_iso, life_expectancy_years) VALUES (?, ?, ?, ?)"
  ).run(userKey, "define your north star", "2002-09-30T00:00:00.000Z", 80);
}

function toIcsUtc(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

function escapeIcsText(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
}

export async function handleTimeHorizonGet(userKey = "default_operator") {
  return withDb((db) => {
    ensureTimeHorizonProfile(db, userKey);
    const profile = db.prepare("SELECT * FROM time_horizon_profiles WHERE user_key=?").get(userKey) as AnyRow;
    const deadlines = db
      .prepare("SELECT id, label, due_at, sort_order FROM time_horizon_deadlines WHERE user_key=? ORDER BY due_at, sort_order")
      .all(userKey) as AnyRow[];
    return ok({
      userKey,
      profile: {
        focusText: profile?.focus_text ? String(profile.focus_text) : "",
        dobIso: profile?.dob_iso ? String(profile.dob_iso) : "2002-09-30T00:00:00.000Z",
        lifeExpectancyYears: Number(profile?.life_expectancy_years ?? 80)
      },
      deadlines: deadlines.map((row) => ({
        id: String(row.id),
        label: String(row.label),
        dueAt: String(row.due_at),
        sortOrder: Number(row.sort_order ?? 0)
      }))
    });
  });
}

export async function handleTimeHorizonProfile(rawBody: unknown, userKey = "default_operator") {
  const parsed = timeHorizonProfileSchema.parse(rawBody);
  return withDb((db) => {
    ensureTimeHorizonProfile(db, userKey);
    db.prepare(
      `UPDATE time_horizon_profiles
       SET focus_text = COALESCE(?, focus_text),
           dob_iso = COALESCE(?, dob_iso),
           life_expectancy_years = COALESCE(?, life_expectancy_years),
           updated_at = datetime('now')
       WHERE user_key=?`
    ).run(parsed.focusText ?? null, parsed.dobIso ?? null, parsed.lifeExpectancyYears ?? null, userKey);
    return handleTimeHorizonGet(userKey);
  });
}

export async function handleTimeHorizonDeadlineCreate(rawBody: unknown, userKey = "default_operator") {
  const parsed = timeHorizonDeadlineCreateSchema.parse(rawBody);
  return withDb((db) => {
    ensureTimeHorizonProfile(db, userKey);
    const id = randomUUID();
    const sortOrder = Number(
      (db.prepare("SELECT COALESCE(MAX(sort_order), -1) AS max_sort FROM time_horizon_deadlines WHERE user_key=?").get(userKey) as AnyRow)?.max_sort ?? -1
    ) + 1;
    db.prepare("INSERT INTO time_horizon_deadlines (id, user_key, label, due_at, sort_order) VALUES (?, ?, ?, ?, ?)").run(
      id,
      userKey,
      parsed.label,
      parsed.dueAt,
      sortOrder
    );
    return ok({ id, label: parsed.label, dueAt: parsed.dueAt, sortOrder }, 201);
  });
}

export async function handleTimeHorizonDeadlineUpdate(deadlineId: string, rawBody: unknown, userKey = "default_operator") {
  const parsed = timeHorizonDeadlineUpdateSchema.parse(rawBody);
  return withDb((db) => {
    const exists = db.prepare("SELECT id FROM time_horizon_deadlines WHERE id=? AND user_key=?").get(deadlineId, userKey) as { id: string } | undefined;
    if (!exists) return ok({ error: "Deadline not found" }, 404);
    db.prepare(
      `UPDATE time_horizon_deadlines
       SET label = COALESCE(?, label),
           due_at = COALESCE(?, due_at),
           sort_order = COALESCE(?, sort_order),
           updated_at = datetime('now')
       WHERE id=? AND user_key=?`
    ).run(parsed.label ?? null, parsed.dueAt ?? null, parsed.sortOrder ?? null, deadlineId, userKey);
    const row = db.prepare("SELECT id, label, due_at, sort_order FROM time_horizon_deadlines WHERE id=?").get(deadlineId) as AnyRow;
    return ok({
      id: String(row.id),
      label: String(row.label),
      dueAt: String(row.due_at),
      sortOrder: Number(row.sort_order ?? 0)
    });
  });
}

export async function handleTimeHorizonDeadlineDelete(deadlineId: string, userKey = "default_operator") {
  return withDb((db) => {
    db.prepare("DELETE FROM time_horizon_deadlines WHERE id=? AND user_key=?").run(deadlineId, userKey);
    return ok({ ok: true });
  });
}

export async function handleCalendarIcs(query?: { horizon?: string }) {
  return withDb((db) => {
    const params: unknown[] = [];
    let taskSql = "SELECT id, source_type, source_id, title, notes, horizon, due_date, status, updated_at FROM tasks WHERE due_date IS NOT NULL";
    if (query?.horizon) {
      taskSql += " AND horizon=?";
      params.push(query.horizon);
    }
    taskSql += " ORDER BY due_date";
    const tasks = db.prepare(taskSql).all(...params) as AnyRow[];
    const deadlines = db
      .prepare("SELECT id, label, due_at, updated_at FROM time_horizon_deadlines WHERE user_key=? ORDER BY due_at")
      .all("default_operator") as AnyRow[];

    const dtstamp = toIcsUtc(new Date());
    const lines: string[] = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//KHAL//WarRoom Calendar//EN",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      "X-WR-CALNAME:KHAL Execution",
      "X-WR-TIMEZONE:UTC"
    ];

    for (const row of tasks) {
      const due = new Date(String(row.due_date));
      if (Number.isNaN(due.getTime())) continue;
      const end = new Date(due.getTime() + 30 * 60 * 1000);
      const uid = `task-${row.id}@khal`;
      const summary = `[TASK] ${String(row.title)}`;
      const description = `Source: ${String(row.source_type)}/${String(row.source_id)}\\nHorizon: ${String(row.horizon ?? "WEEK")}\\nStatus: ${String(row.status ?? "NOT_STARTED")}${
        row.notes ? `\\nNotes: ${String(row.notes)}` : ""
      }`;
      lines.push("BEGIN:VEVENT");
      lines.push(`UID:${uid}`);
      lines.push(`DTSTAMP:${dtstamp}`);
      lines.push(`DTSTART:${toIcsUtc(due)}`);
      lines.push(`DTEND:${toIcsUtc(end)}`);
      lines.push(`SUMMARY:${escapeIcsText(summary)}`);
      lines.push(`DESCRIPTION:${escapeIcsText(description)}`);
      lines.push("END:VEVENT");
    }

    for (const row of deadlines) {
      const due = new Date(String(row.due_at));
      if (Number.isNaN(due.getTime())) continue;
      const end = new Date(due.getTime() + 60 * 60 * 1000);
      const uid = `deadline-${row.id}@khal`;
      lines.push("BEGIN:VEVENT");
      lines.push(`UID:${uid}`);
      lines.push(`DTSTAMP:${dtstamp}`);
      lines.push(`DTSTART:${toIcsUtc(due)}`);
      lines.push(`DTEND:${toIcsUtc(end)}`);
      lines.push(`SUMMARY:${escapeIcsText(`[DEADLINE] ${String(row.label)}`)}`);
      lines.push("END:VEVENT");
    }

    lines.push("END:VCALENDAR");

    return new NextResponse(lines.join("\r\n"), {
      status: 200,
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": "inline; filename=\"khal.ics\"",
        "Cache-Control": "no-store"
      }
    });
  });
}
