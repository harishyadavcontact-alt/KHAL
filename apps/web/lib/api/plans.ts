import { randomUUID } from "node:crypto";
import { z } from "zod";
import { ok, withDb } from "../api";

type AnyRow = Record<string, unknown>;

const planBlueprintCreateSchema = z.object({
  sourceType: z.enum(["SOURCE", "DOMAIN", "AFFAIR", "INTEREST", "CRAFT", "MISSION", "LINEAGE"]),
  sourceId: z.string().min(1),
  title: z.string().min(1),
  scheduleStart: z.string().optional(),
  scheduleEnd: z.string().optional(),
  cadence: z.string().optional(),
  milestones: z.array(z.record(z.unknown())).default([]),
  criteria: z.array(z.record(z.unknown())).default([]),
  thresholds: z.array(z.record(z.unknown())).default([]),
  preparation: z.record(z.unknown()).default({}),
  extras: z.record(z.unknown()).default({}),
  status: z.string().default("DRAFT"),
  lineageNodeId: z.string().optional(),
  actorType: z.enum(["personal", "private", "public"]).optional(),
  riskRegisterIds: z.array(z.string()).default([])
});

const planBlueprintUpdateSchema = z.object({
  title: z.string().optional(),
  scheduleStart: z.string().nullable().optional(),
  scheduleEnd: z.string().nullable().optional(),
  cadence: z.string().nullable().optional(),
  milestones: z.array(z.record(z.unknown())).optional(),
  criteria: z.array(z.record(z.unknown())).optional(),
  thresholds: z.array(z.record(z.unknown())).optional(),
  preparation: z.record(z.unknown()).optional(),
  extras: z.record(z.unknown()).optional(),
  status: z.string().optional(),
  lineageNodeId: z.string().nullable().optional(),
  actorType: z.enum(["personal", "private", "public"]).nullable().optional(),
  riskRegisterIds: z.array(z.string()).optional()
});

function parseJsonOrDefault<T>(value: unknown, fallback: T): T {
  if (typeof value !== "string" || !value.trim()) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function mapPlanBlueprintRow(row: AnyRow, target?: AnyRow) {
  return {
    id: String(row.id),
    sourceType: String(row.source_type),
    sourceId: String(row.source_id),
    title: String(row.title),
    scheduleStart: row.schedule_start ? String(row.schedule_start) : undefined,
    scheduleEnd: row.schedule_end ? String(row.schedule_end) : undefined,
    cadence: row.cadence ? String(row.cadence) : undefined,
    milestones: parseJsonOrDefault<Array<Record<string, unknown>>>(row.milestones_json, []),
    criteria: parseJsonOrDefault<Array<Record<string, unknown>>>(row.criteria_json, []),
    thresholds: parseJsonOrDefault<Array<Record<string, unknown>>>(row.thresholds_json, []),
    preparation: parseJsonOrDefault<Record<string, unknown>>(row.preparation_json, {}),
    extras: parseJsonOrDefault<Record<string, unknown>>(row.extras_json, {}),
    status: String(row.status ?? "DRAFT"),
    lineageNodeId: target?.lineage_node_id ? String(target.lineage_node_id) : undefined,
    actorType: target?.actor_type ? String(target.actor_type) : undefined,
    riskRegisterIds: parseJsonOrDefault<string[]>(target?.risk_register_ids_json, [])
  };
}

export async function handlePlansGet(sourceType?: string, sourceId?: string) {
  return withDb((db) => {
    let rows: AnyRow[] = [];
    if (sourceType && sourceId) {
      rows = db
        .prepare("SELECT * FROM plan_blueprints WHERE source_type=? AND source_id=? ORDER BY updated_at DESC, created_at DESC")
        .all(sourceType, sourceId) as AnyRow[];
    } else {
      rows = db.prepare("SELECT * FROM plan_blueprints ORDER BY updated_at DESC, created_at DESC").all() as AnyRow[];
    }
    const targets = db.prepare("SELECT * FROM plan_blueprint_lineage_targets").all() as AnyRow[];
    const targetByPlan = new Map(targets.map((target) => [String(target.plan_id), target]));
    return ok(rows.map((row) => mapPlanBlueprintRow(row, targetByPlan.get(String(row.id)))));
  });
}

export async function handlePlansCreate(rawBody: unknown) {
  const parsed = planBlueprintCreateSchema.parse(rawBody);
  return withDb((db) => {
    const id = randomUUID();
    db.prepare(
      `INSERT INTO plan_blueprints
      (id, source_type, source_id, title, schedule_start, schedule_end, cadence, milestones_json, criteria_json, thresholds_json, preparation_json, extras_json, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      id,
      parsed.sourceType,
      parsed.sourceId,
      parsed.title,
      parsed.scheduleStart ?? null,
      parsed.scheduleEnd ?? null,
      parsed.cadence ?? null,
      JSON.stringify(parsed.milestones ?? []),
      JSON.stringify(parsed.criteria ?? []),
      JSON.stringify(parsed.thresholds ?? []),
      JSON.stringify(parsed.preparation ?? {}),
      JSON.stringify(parsed.extras ?? {}),
      parsed.status ?? "DRAFT"
    );
    db.prepare(
      `INSERT INTO plan_blueprint_lineage_targets (plan_id, lineage_node_id, actor_type, risk_register_ids_json, updated_at)
       VALUES (?, ?, ?, ?, datetime('now'))
       ON CONFLICT(plan_id) DO UPDATE SET
         lineage_node_id=excluded.lineage_node_id,
         actor_type=excluded.actor_type,
         risk_register_ids_json=excluded.risk_register_ids_json,
         updated_at=datetime('now')`
    ).run(id, parsed.lineageNodeId ?? null, parsed.actorType ?? null, JSON.stringify(parsed.riskRegisterIds ?? []));
    const row = db.prepare("SELECT * FROM plan_blueprints WHERE id=?").get(id) as AnyRow;
    const target = db.prepare("SELECT * FROM plan_blueprint_lineage_targets WHERE plan_id=?").get(id) as AnyRow | undefined;
    return ok(mapPlanBlueprintRow(row, target), 201);
  });
}

export async function handlePlansPatch(planId: string, rawBody: unknown) {
  const parsed = planBlueprintUpdateSchema.parse(rawBody);
  return withDb((db) => {
    const exists = db.prepare("SELECT id FROM plan_blueprints WHERE id=?").get(planId) as { id: string } | undefined;
    if (!exists) return ok({ error: "Plan blueprint not found" }, 404);
    db.prepare(
      `UPDATE plan_blueprints
       SET title = COALESCE(?, title),
           schedule_start = CASE WHEN ? IS NULL THEN schedule_start ELSE ? END,
           schedule_end = CASE WHEN ? IS NULL THEN schedule_end ELSE ? END,
           cadence = CASE WHEN ? IS NULL THEN cadence ELSE ? END,
           milestones_json = COALESCE(?, milestones_json),
           criteria_json = COALESCE(?, criteria_json),
           thresholds_json = COALESCE(?, thresholds_json),
           preparation_json = COALESCE(?, preparation_json),
           extras_json = COALESCE(?, extras_json),
           status = COALESCE(?, status),
           updated_at = datetime('now')
       WHERE id=?`
    ).run(
      parsed.title ?? null,
      parsed.scheduleStart === undefined ? null : "",
      parsed.scheduleStart ?? null,
      parsed.scheduleEnd === undefined ? null : "",
      parsed.scheduleEnd ?? null,
      parsed.cadence === undefined ? null : "",
      parsed.cadence ?? null,
      parsed.milestones ? JSON.stringify(parsed.milestones) : null,
      parsed.criteria ? JSON.stringify(parsed.criteria) : null,
      parsed.thresholds ? JSON.stringify(parsed.thresholds) : null,
      parsed.preparation ? JSON.stringify(parsed.preparation) : null,
      parsed.extras ? JSON.stringify(parsed.extras) : null,
      parsed.status ?? null,
      planId
    );
    if (parsed.lineageNodeId !== undefined || parsed.actorType !== undefined || parsed.riskRegisterIds !== undefined) {
      db.prepare(
        `INSERT INTO plan_blueprint_lineage_targets (plan_id, lineage_node_id, actor_type, risk_register_ids_json, updated_at)
         VALUES (?, ?, ?, ?, datetime('now'))
         ON CONFLICT(plan_id) DO UPDATE SET
           lineage_node_id=CASE WHEN ? THEN excluded.lineage_node_id ELSE plan_blueprint_lineage_targets.lineage_node_id END,
           actor_type=CASE WHEN ? THEN excluded.actor_type ELSE plan_blueprint_lineage_targets.actor_type END,
           risk_register_ids_json=CASE WHEN ? THEN excluded.risk_register_ids_json ELSE plan_blueprint_lineage_targets.risk_register_ids_json END,
           updated_at=datetime('now')`
      ).run(
        planId,
        parsed.lineageNodeId ?? null,
        parsed.actorType ?? null,
        parsed.riskRegisterIds ? JSON.stringify(parsed.riskRegisterIds) : "[]",
        parsed.lineageNodeId !== undefined ? 1 : 0,
        parsed.actorType !== undefined ? 1 : 0,
        parsed.riskRegisterIds !== undefined ? 1 : 0
      );
    }
    const row = db.prepare("SELECT * FROM plan_blueprints WHERE id=?").get(planId) as AnyRow;
    const target = db.prepare("SELECT * FROM plan_blueprint_lineage_targets WHERE plan_id=?").get(planId) as AnyRow | undefined;
    return ok(mapPlanBlueprintRow(row, target));
  });
}

