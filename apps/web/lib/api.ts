import { NextResponse } from "next/server";
import { z } from "zod";
import { loadState, normalize, refreshIfStale, writeAffair, writeInterest, writeTask } from "@khal/sync-engine";
import { randomUUID } from "node:crypto";
import { readSettings } from "./settings";

const affairSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(1),
  domainId: z.string().optional(),
  timeline: z.string().optional(),
  stakes: z.number().min(0).max(10).optional(),
  risk: z.number().min(0).max(10).optional(),
  status: z.enum(["NOT_STARTED", "IN_PROGRESS", "DONE", "PARKED", "WAITING"]).optional(),
  completionPct: z.number().min(0).max(100).optional(),
  lastSeenModifiedAt: z.string().optional()
});

const interestSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(1),
  domainId: z.string().optional(),
  stakes: z.number().min(0).max(10).optional(),
  risk: z.number().min(0).max(10).optional(),
  convexity: z.number().min(0).max(10).optional(),
  asymmetry: z.string().optional(),
  upside: z.string().optional(),
  downside: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(["NOT_STARTED", "IN_PROGRESS", "DONE", "PARKED", "WAITING"]).optional(),
  lastSeenModifiedAt: z.string().optional()
});

const taskSchema = z.object({
  id: z.string().uuid().optional(),
  sourceType: z.enum(["AFFAIR", "INTEREST", "PLAN", "PREPARATION"]),
  sourceId: z.string().min(1),
  title: z.string().min(1),
  status: z.enum(["NOT_STARTED", "IN_PROGRESS", "DONE", "PARKED", "WAITING"]).optional(),
  dependencyIds: z.array(z.string()).optional(),
  horizon: z.enum(["WEEK", "MONTH", "QUARTER", "YEAR"]).optional(),
  dueDate: z.string().optional(),
  effortEstimate: z.number().optional(),
  lastSeenModifiedAt: z.string().optional()
});

export async function withWorkbook<T>(fn: (workbookPath: string) => Promise<T> | T): Promise<T> {
  const settings = await readSettings();
  return fn(settings.workbookPath);
}

export function ok(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

function extractTopStackFrame(stack?: string): string | undefined {
  if (!stack) return undefined;
  const line = stack.split("\n").map((value) => value.trim()).find((value) => value.startsWith("at "));
  return line;
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

export async function handleState() {
  return withWorkbook((workbookPath) => ok(loadState(workbookPath)));
}

export async function handleRefresh() {
  return withWorkbook((workbookPath) => ok(refreshIfStale(workbookPath)));
}

export async function handleNormalize() {
  return withWorkbook((workbookPath) => ok(normalize(workbookPath)));
}

export async function handleAffair(rawBody: unknown) {
  const parsed = affairSchema.parse(rawBody);
  const id = parsed.id ?? randomUUID();
  return withWorkbook((workbookPath) =>
    ok(writeAffair(workbookPath, { ...parsed, id }, parsed.lastSeenModifiedAt), parsed.id ? 200 : 201)
  );
}

export async function handleInterest(rawBody: unknown) {
  const parsed = interestSchema.parse(rawBody);
  const id = parsed.id ?? randomUUID();
  return withWorkbook((workbookPath) =>
    ok(writeInterest(workbookPath, { ...parsed, id }, parsed.lastSeenModifiedAt), parsed.id ? 200 : 201)
  );
}

export async function handleTask(rawBody: unknown) {
  const parsed = taskSchema.parse(rawBody);
  const id = parsed.id ?? randomUUID();

  return withWorkbook((workbookPath) => {
    const loaded = loadState(workbookPath);
    return ok(writeTask(workbookPath, { ...parsed, id }, loaded.state.tasks, parsed.lastSeenModifiedAt), parsed.id ? 200 : 201);
  });
}
