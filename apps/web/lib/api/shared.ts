import { randomUUID } from "node:crypto";
import Database from "better-sqlite3";
import { NextResponse } from "next/server";
import { initDatabase, resolveDbPath } from "@khal/sqlite-core";
import { readSettings } from "../settings";

export type AnyRow = Record<string, unknown>;

export async function withStore<T>(fn: (dbPath: string) => Promise<T> | T): Promise<T> {
  const settings = await readSettings();
  return fn(settings.dbPath);
}

export async function withDb<T>(fn: (db: Database.Database, dbPath: string) => Promise<T> | T): Promise<T> {
  const settings = await readSettings();
  const dbPath = resolveDbPath(settings.dbPath);
  initDatabase(dbPath);
  const db = new Database(dbPath);
  try {
    return await fn(db, dbPath);
  } finally {
    db.close();
  }
}

export function ok(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

function extractTopStackFrame(stack?: string): string | undefined {
  if (!stack) return undefined;
  return stack.split("\n").map((value) => value.trim()).find((value) => value.startsWith("at "));
}

export function fail(error: unknown, status = 400) {
  const traceId = randomUUID();
  const message = error instanceof Error ? error.message : "Unknown error";
  const payload: Record<string, unknown> = { error: message, traceId };

  if (process.env.NODE_ENV !== "production") {
    payload.debug = {
      topStackFrame: error instanceof Error ? extractTopStackFrame(error.stack) : undefined
    };
  }

  console.error("[khal-api-error]", { traceId, status, message, stack: error instanceof Error ? error.stack : undefined });
  return NextResponse.json(payload, { status });
}
