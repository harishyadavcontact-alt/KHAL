import { randomUUID } from "node:crypto";
import { z } from "zod";
import type Database from "better-sqlite3";
import { withDb, ok } from "../api";

type AnyRow = Record<string, unknown>;

const doctrineRulebookSchema = z.object({
  id: z.string().optional(),
  scopeType: z.enum(["GLOBAL", "MODE", "ENTITY"]),
  scopeRef: z.string().min(1),
  name: z.string().min(1),
  active: z.boolean().optional()
});

const doctrineRuleCreateSchema = z.object({
  id: z.string().optional(),
  rulebookId: z.string().min(1),
  kind: z.enum(["RULE", "POLICY", "OMISSION", "TRIGGER", "BARRIER", "BET_RULE"]),
  code: z.string().min(1),
  statement: z.string().min(1),
  triggerText: z.string().optional(),
  actionText: z.string().optional(),
  failureCostText: z.string().optional(),
  severity: z.enum(["HARD_GATE", "SOFT"]),
  stage: z.enum(["A", "B", "C", "D", "E"]).optional(),
  sortOrder: z.number().int().optional(),
  active: z.boolean().optional()
});

const doctrineRulePatchSchema = doctrineRuleCreateSchema.partial().omit({ rulebookId: true });

const domainPnLLadderLevelSchema = z.object({
  id: z.string().optional(),
  level: z.number().int().min(1),
  levelName: z.string().min(1),
  threshold: z.record(z.any()).default({}),
  status: z.enum(["LOCKED", "ACTIVE", "PASSED"]).default("LOCKED"),
  evidence: z.record(z.any()).default({})
});

const domainPnLLadderPutSchema = z.object({
  levels: z.array(domainPnLLadderLevelSchema).default([])
});

function parseJsonOrDefault<T>(value: unknown, fallback: T): T {
  if (typeof value !== "string" || !value.trim()) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function mapDoctrineRulebookRow(row: AnyRow) {
  return {
    id: String(row.id),
    scopeType: String(row.scope_type),
    scopeRef: String(row.scope_ref),
    name: String(row.name),
    active: Number(row.active ?? 1) === 1
  };
}

function mapDoctrineRuleRow(row: AnyRow) {
  return {
    id: String(row.id),
    rulebookId: String(row.rulebook_id),
    kind: String(row.kind),
    code: String(row.code),
    statement: String(row.statement),
    triggerText: row.trigger_text ? String(row.trigger_text) : undefined,
    actionText: row.action_text ? String(row.action_text) : undefined,
    failureCostText: row.failure_cost_text ? String(row.failure_cost_text) : undefined,
    severity: String(row.severity),
    stage: row.stage ? String(row.stage) : undefined,
    sortOrder: Number(row.sort_order ?? 0),
    active: Number(row.active ?? 1) === 1
  };
}

function mapDomainPnLLadderRow(row: AnyRow) {
  return {
    id: String(row.id),
    domainId: String(row.domain_id),
    level: Number(row.level ?? 1),
    levelName: String(row.level_name),
    threshold: parseJsonOrDefault<Record<string, unknown>>(row.threshold_json, {}),
    status: String(row.status ?? "LOCKED"),
    evidence: parseJsonOrDefault<Record<string, unknown>>(row.evidence_json, {})
  };
}

function loadAllActiveRulebooks(db: Database.Database): AnyRow[] {
  return db
    .prepare("SELECT id, scope_type, scope_ref, name, active FROM doctrine_rulebooks WHERE active=1 ORDER BY scope_type, scope_ref, name")
    .all() as AnyRow[];
}

export async function handleDoctrineRulebooksGet(scopeType?: string, scopeRef?: string, mode?: string) {
  return withDb((db) => {
    const base = loadAllActiveRulebooks(db);
    const filtered = mode
      ? base.filter((row) => {
          const type = String(row.scope_type);
          const ref = String(row.scope_ref);
          if (type === "GLOBAL" && ref === "all") return true;
          if (type === "MODE" && ref === mode) return true;
          if (type === "ENTITY" && scopeRef && ref === scopeRef) return true;
          return false;
        })
      : base.filter((row) => {
          if (scopeType && String(row.scope_type) !== scopeType) return false;
          if (scopeRef && String(row.scope_ref) !== scopeRef) return false;
          return true;
        });

    const rulebookIds = filtered.map((row) => String(row.id));
    const rules = rulebookIds.length
      ? (db
          .prepare(
            `SELECT id, rulebook_id, kind, code, statement, trigger_text, action_text, failure_cost_text, severity, stage, sort_order, active
             FROM doctrine_rules
             WHERE active=1 AND rulebook_id IN (${rulebookIds.map(() => "?").join(",")})
             ORDER BY sort_order, created_at`
          )
          .all(...rulebookIds) as AnyRow[])
      : [];

    return ok({
      rulebooks: filtered.map(mapDoctrineRulebookRow),
      rules: rules.map(mapDoctrineRuleRow)
    });
  });
}

export async function handleDoctrineRulebookPut(rulebookId: string, rawBody: unknown) {
  const parsed = doctrineRulebookSchema.partial().parse(rawBody);
  return withDb((db) => {
    const exists = db.prepare("SELECT id FROM doctrine_rulebooks WHERE id=?").get(rulebookId) as { id: string } | undefined;
    if (!exists) return ok({ error: "Doctrine rulebook not found" }, 404);
    db.prepare(
      `UPDATE doctrine_rulebooks
       SET scope_type=COALESCE(?, scope_type),
           scope_ref=COALESCE(?, scope_ref),
           name=COALESCE(?, name),
           active=COALESCE(?, active),
           updated_at=datetime('now')
       WHERE id=?`
    ).run(
      parsed.scopeType ?? null,
      parsed.scopeRef ?? null,
      parsed.name ?? null,
      parsed.active === undefined ? null : parsed.active ? 1 : 0,
      rulebookId
    );
    const row = db.prepare("SELECT * FROM doctrine_rulebooks WHERE id=?").get(rulebookId) as AnyRow;
    return ok(mapDoctrineRulebookRow(row));
  });
}

export async function handleDoctrineRulesGet(rulebookId?: string, stage?: string, severity?: string, kind?: string) {
  return withDb((db) => {
    const rows = db
      .prepare(
        `SELECT id, rulebook_id, kind, code, statement, trigger_text, action_text, failure_cost_text, severity, stage, sort_order, active
         FROM doctrine_rules
         WHERE (? IS NULL OR rulebook_id=?)
           AND (? IS NULL OR stage=?)
           AND (? IS NULL OR severity=?)
           AND (? IS NULL OR kind=?)
         ORDER BY sort_order, created_at`
      )
      .all(rulebookId ?? null, rulebookId ?? null, stage ?? null, stage ?? null, severity ?? null, severity ?? null, kind ?? null, kind ?? null) as AnyRow[];
    return ok(rows.map(mapDoctrineRuleRow));
  });
}

export async function handleDoctrineRuleCreate(rawBody: unknown) {
  const parsed = doctrineRuleCreateSchema.parse(rawBody);
  return withDb((db) => {
    const id = parsed.id ?? randomUUID();
    db.prepare(
      `INSERT INTO doctrine_rules
       (id, rulebook_id, kind, code, statement, trigger_text, action_text, failure_cost_text, severity, stage, sort_order, active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      id,
      parsed.rulebookId,
      parsed.kind,
      parsed.code,
      parsed.statement,
      parsed.triggerText ?? null,
      parsed.actionText ?? null,
      parsed.failureCostText ?? null,
      parsed.severity,
      parsed.stage ?? null,
      parsed.sortOrder ?? 0,
      parsed.active === undefined ? 1 : parsed.active ? 1 : 0
    );
    const row = db.prepare("SELECT * FROM doctrine_rules WHERE id=?").get(id) as AnyRow;
    return ok(mapDoctrineRuleRow(row), 201);
  });
}

export async function handleDoctrineRulePatch(ruleId: string, rawBody: unknown) {
  const parsed = doctrineRulePatchSchema.parse(rawBody);
  return withDb((db) => {
    const exists = db.prepare("SELECT id FROM doctrine_rules WHERE id=?").get(ruleId) as { id: string } | undefined;
    if (!exists) return ok({ error: "Doctrine rule not found" }, 404);
    db.prepare(
      `UPDATE doctrine_rules
       SET kind=COALESCE(?, kind),
           code=COALESCE(?, code),
           statement=COALESCE(?, statement),
           trigger_text=COALESCE(?, trigger_text),
           action_text=COALESCE(?, action_text),
           failure_cost_text=COALESCE(?, failure_cost_text),
           severity=COALESCE(?, severity),
           stage=COALESCE(?, stage),
           sort_order=COALESCE(?, sort_order),
           active=COALESCE(?, active),
           updated_at=datetime('now')
       WHERE id=?`
    ).run(
      parsed.kind ?? null,
      parsed.code ?? null,
      parsed.statement ?? null,
      parsed.triggerText ?? null,
      parsed.actionText ?? null,
      parsed.failureCostText ?? null,
      parsed.severity ?? null,
      parsed.stage ?? null,
      parsed.sortOrder ?? null,
      parsed.active === undefined ? null : parsed.active ? 1 : 0,
      ruleId
    );
    const row = db.prepare("SELECT * FROM doctrine_rules WHERE id=?").get(ruleId) as AnyRow;
    return ok(mapDoctrineRuleRow(row));
  });
}

export async function handleDomainPnLLadderGet(domainId: string) {
  return withDb((db) => {
    const rows = db
      .prepare(
        `SELECT id, domain_id, level, level_name, threshold_json, status, evidence_json
         FROM domain_pnl_ladders
         WHERE domain_id=?
         ORDER BY level`
      )
      .all(domainId) as AnyRow[];
    return ok({
      domainId,
      levels: rows.map(mapDomainPnLLadderRow)
    });
  });
}

export async function handleDomainPnLLadderPut(domainId: string, rawBody: unknown) {
  const parsed = domainPnLLadderPutSchema.parse(rawBody);
  return withDb((db) => {
    const tx = db.transaction(() => {
      db.prepare("DELETE FROM domain_pnl_ladders WHERE domain_id=?").run(domainId);
      const stmt = db.prepare(
        `INSERT INTO domain_pnl_ladders (id, domain_id, level, level_name, threshold_json, status, evidence_json)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      );
      for (const level of parsed.levels) {
        stmt.run(
          level.id ?? randomUUID(),
          domainId,
          level.level,
          level.levelName,
          JSON.stringify(level.threshold ?? {}),
          level.status ?? "LOCKED",
          JSON.stringify(level.evidence ?? {})
        );
      }
    });
    tx();
    return handleDomainPnLLadderGet(domainId);
  });
}

