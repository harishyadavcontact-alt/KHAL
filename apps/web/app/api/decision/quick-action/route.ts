import { randomUUID } from "node:crypto";
import { z } from "zod";
import { fail, ok, withDb, withStore } from "../../../../lib/api";
import { evaluateDecisionWithTriage } from "../../../../lib/decision-spec";
import { writeInterest } from "@khal/sync-engine";
import { loadRuntimeProjection } from "../../../../lib/runtime/authority";

const schema = z.object({
  kind: z.enum([
    "SET_INTEREST_MAX_LOSS_DEFAULT",
    "SET_INTEREST_EXPIRY_DEFAULT_30D",
    "ADD_INTEREST_KILL_CRITERIA_TEMPLATE",
    "SET_INTEREST_BARBELL_90_10",
    "SET_AFFAIR_THRESHOLD_TEMPLATE",
    "SET_AFFAIR_PREP_TEMPLATE",
    "SET_DOMAIN_BIMODAL_POSTURE_TEMPLATE",
    "TRIPWIRE_RECOVERY_PATH"
  ]),
  targetRef: z.object({
    mode: z.enum(["source", "domain", "affair", "interest", "craft", "lineage", "mission"]),
    targetId: z.string()
  }),
  payload: z.record(z.unknown()).optional(),
  role: z.enum(["MISSIONARY", "VISIONARY"]).optional(),
  noRuinGate: z.boolean().optional(),
  overrides: z.array(z.string()).optional(),
  operator: z.string().default("system")
});

function plusDaysIso(days: number): string {
  const now = new Date();
  now.setDate(now.getDate() + days);
  return now.toISOString();
}

export async function POST(request: Request) {
  try {
    const parsed = schema.parse(await request.json());
    const targetId = parsed.targetRef.targetId;

    if (parsed.kind === "TRIPWIRE_RECOVERY_PATH") {
      return ok({
        applied: false,
        message: "No-ruin recovery is guidance-only and cannot be auto-mutated."
      });
    }

    const loaded = await withStore((dbPath) => loadRuntimeProjection({ dbPath }));
    if (parsed.kind.startsWith("SET_INTEREST_") || parsed.kind === "ADD_INTEREST_KILL_CRITERIA_TEMPLATE") {
      const existing = loaded.state.interests.find((item) => item.id === targetId);
      if (!existing) return ok({ error: "Interest not found" }, 404);

      const payload = parsed.payload ?? {};
      const maxLossDefault = Number(payload.maxLossPct ?? 10);
      const hedgeDefault = Number(payload.hedgePct ?? 90);
      const edgeDefault = Number(payload.edgePct ?? 10);
      const expiryDays = Number(payload.expiryOffsetDays ?? 30);
      const criteriaTemplate = Array.isArray(payload.killCriteria) ? payload.killCriteria.map(String) : ["No measurable edge by expiry review."];

      const next = {
        ...existing,
        maxLossPct: parsed.kind === "SET_INTEREST_MAX_LOSS_DEFAULT" ? maxLossDefault : existing.maxLossPct,
        expiryDate: parsed.kind === "SET_INTEREST_EXPIRY_DEFAULT_30D" ? plusDaysIso(expiryDays) : existing.expiryDate,
        hedgePct: parsed.kind === "SET_INTEREST_BARBELL_90_10" ? hedgeDefault : existing.hedgePct,
        edgePct: parsed.kind === "SET_INTEREST_BARBELL_90_10" ? edgeDefault : existing.edgePct,
        killCriteria:
          parsed.kind === "ADD_INTEREST_KILL_CRITERIA_TEMPLATE"
            ? Array.from(new Set([...(existing.killCriteria ?? []), ...criteriaTemplate]))
            : existing.killCriteria
      };

      await withStore((dbPath) => {
        writeInterest(
          dbPath,
          {
            id: existing.id,
            title: existing.title,
            domainId: existing.domainId,
            stakes: existing.stakes,
            risk: existing.risk,
            convexity: existing.convexity,
            status: existing.status,
            labStage: existing.labStage,
            hypothesis: existing.hypothesis,
            maxLossPct: next.maxLossPct,
            expiryDate: next.expiryDate,
            killCriteria: next.killCriteria,
            hedgePct: next.hedgePct,
            edgePct: next.edgePct,
            irreversibility: existing.irreversibility,
            evidenceNote: existing.evidenceNote
          },
          undefined
        );
      });
    }

    if (parsed.kind === "SET_AFFAIR_THRESHOLD_TEMPLATE") {
      await withDb((db) => {
        const affair = db.prepare("SELECT id FROM affairs WHERE id=?").get(targetId) as { id: string } | undefined;
        if (!affair) throw new Error("Affair not found");
        const objectives = JSON.stringify(["Define no-ruin threshold"]);
        const uncertainty = "Known constraints";
        const timeHorizon = "WEEK";
        const exists = db.prepare("SELECT affair_id FROM affair_plan_details WHERE affair_id=?").get(targetId) as { affair_id: string } | undefined;
        if (exists) {
          db.prepare(
            `UPDATE affair_plan_details
             SET objectives_json=?, uncertainty=?, time_horizon=?, updated_at=datetime('now')
             WHERE affair_id=?`
          ).run(objectives, uncertainty, timeHorizon, targetId);
        } else {
          db.prepare(
            `INSERT INTO affair_plan_details (affair_id, objectives_json, uncertainty, time_horizon, updated_at)
             VALUES (?, ?, ?, ?, datetime('now'))`
          ).run(targetId, objectives, uncertainty, timeHorizon);
        }
      });
    }

    if (parsed.kind === "SET_AFFAIR_PREP_TEMPLATE") {
      await withDb((db) => {
        const affair = db.prepare("SELECT id FROM affairs WHERE id=?").get(targetId) as { id: string } | undefined;
        if (!affair) throw new Error("Affair not found");
        const firstCraft = db.prepare("SELECT id FROM crafts ORDER BY created_at LIMIT 1").get() as { id: string } | undefined;
        const craftId = firstCraft?.id ?? "craft-default";
        if (!firstCraft) {
          db.prepare("INSERT INTO crafts (id, name, description) VALUES (?, ?, ?)").run(craftId, "craft-default", "Auto-created default craft");
        }
        const methodology = "Checklist first";
        const technology = "Minimal moving parts";
        const techniques = "Fail-safe rehearsal";
        const exists = db.prepare("SELECT affair_id FROM affair_means WHERE affair_id=?").get(targetId) as { affair_id: string } | undefined;
        if (exists) {
          db.prepare(
            "UPDATE affair_means SET craft_id=?, methodology=?, technology=?, techniques=?, updated_at=datetime('now') WHERE affair_id=?"
          ).run(craftId, methodology, technology, techniques, targetId);
        } else {
          db.prepare("INSERT INTO affair_means (affair_id, craft_id, methodology, technology, techniques) VALUES (?, ?, ?, ?, ?)").run(
            targetId,
            craftId,
            methodology,
            technology,
            techniques
          );
        }
      });
    }

    if (parsed.kind === "SET_DOMAIN_BIMODAL_POSTURE_TEMPLATE") {
      await withDb((db) => {
        const domain = db.prepare("SELECT id FROM domains WHERE id=?").get(targetId) as { id: string } | undefined;
        if (!domain) throw new Error("Domain not found");
        const payload = parsed.payload ?? {};
        const hedgeText = String(payload.hedgeText ?? "Protect downside via robust baseline.");
        const edgeText = String(payload.edgeText ?? "Expose to asymmetric upside via capped bets.");
        const exists = db.prepare("SELECT domain_id FROM domain_strategy_details WHERE domain_id=?").get(targetId) as { domain_id: string } | undefined;
        if (exists) {
          db.prepare(
            `UPDATE domain_strategy_details
             SET hedge_text=COALESCE(?, hedge_text), edge_text=COALESCE(?, edge_text), updated_at=datetime('now')
             WHERE domain_id=?`
          ).run(hedgeText, edgeText, targetId);
        } else {
          db.prepare(
            `INSERT INTO domain_strategy_details
             (domain_id, hedge_text, edge_text)
             VALUES (?, ?, ?)`
          ).run(targetId, hedgeText, edgeText);
        }
      });
    }

    const evaluationProjection = await withStore((dbPath) => {
      const projection = loadRuntimeProjection({ dbPath });
      const evaluation = evaluateDecisionWithTriage({
        mode: parsed.targetRef.mode,
        targetId,
        role: parsed.role,
        noRuinGate: parsed.noRuinGate,
        overrides: parsed.overrides,
        state: projection.state
      });
      return { evaluation, runtimeInvariants: projection.runtimeInvariants.summary };
    });

    await withDb((db) => {
      db.prepare(
        `INSERT INTO decision_evaluations
         (id, mode, target_id, role, blocked, readiness_score, result_json, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))`
      ).run(
        randomUUID(),
        parsed.targetRef.mode,
        targetId,
        parsed.role ?? "MISSIONARY",
        evaluationProjection.evaluation.blocked ? 1 : 0,
        evaluationProjection.evaluation.readinessScore,
        JSON.stringify({ quickActionKind: parsed.kind, evaluation: evaluationProjection.evaluation, runtimeInvariants: evaluationProjection.runtimeInvariants })
      );
    });

    return ok({
      applied: true,
      action: parsed.kind,
      targetRef: parsed.targetRef,
      evaluation: evaluationProjection.evaluation,
      runtimeInvariants: evaluationProjection.runtimeInvariants
    });
  } catch (error) {
    return fail(error, 400);
  }
}
