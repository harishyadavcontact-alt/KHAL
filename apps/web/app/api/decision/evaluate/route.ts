import { z } from "zod";
import { randomUUID } from "node:crypto";
import { fail, ok, withDb } from "../../../../lib/api";
import { evaluateDecision } from "../../../../lib/decision-spec";
import { loadRuntimeProjection } from "../../../../lib/runtime/authority";

const schema = z.object({
  mode: z.enum(["source", "domain", "affair", "interest", "craft", "lineage", "mission"]),
  targetId: z.string(),
  role: z.enum(["MISSIONARY", "VISIONARY"]).optional(),
  noRuinGate: z.boolean().optional(),
  overrides: z.array(z.string()).optional()
});

export async function POST(request: Request) {
  try {
    const parsed = schema.parse(await request.json());
    return withDb((db, dbPath) => {
      const projection = loadRuntimeProjection({ db, dbPath });
      const result = evaluateDecision({
        mode: parsed.mode,
        targetId: parsed.targetId,
        state: projection.state,
        role: parsed.role,
        noRuinGate: parsed.noRuinGate,
        overrides: parsed.overrides
      });
      db.prepare(
        `INSERT INTO decision_evaluations
         (id, mode, target_id, role, blocked, readiness_score, result_json, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))`
      ).run(
        randomUUID(),
        parsed.mode,
        parsed.targetId,
        parsed.role ?? "MISSIONARY",
        result.blocked ? 1 : 0,
        result.readinessScore,
        JSON.stringify({ ...result, runtimeInvariants: projection.runtimeInvariants.summary })
      );
      return ok({ ...result, runtimeInvariants: projection.runtimeInvariants.summary });
    });
  } catch (error) {
    return fail(error, 400);
  }
}
