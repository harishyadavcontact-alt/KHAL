import { randomUUID } from "node:crypto";
import { z } from "zod";
import { fail, ok, withDb } from "../../../../lib/api";

const schema = z.object({
  mode: z.enum(["source", "domain", "affair", "interest", "craft", "lineage", "mission"]),
  targetId: z.string(),
  guardIds: z.array(z.string()).min(1),
  overrideReason: z.string().min(5),
  operator: z.string().min(1)
});

export async function POST(request: Request) {
  try {
    const parsed = schema.parse(await request.json());
    const id = randomUUID();
    return withDb((db) => {
      db.prepare(
        `INSERT INTO decision_overrides
         (id, mode, target_id, guard_ids_json, override_reason, operator, created_at)
         VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`
      ).run(id, parsed.mode, parsed.targetId, JSON.stringify(parsed.guardIds), parsed.overrideReason, parsed.operator);
      return ok(
        {
          id,
          mode: parsed.mode,
          targetId: parsed.targetId,
          guardIds: parsed.guardIds,
          overrideReason: parsed.overrideReason,
          operator: parsed.operator,
          timestamp: new Date().toISOString()
        },
        201
      );
    });
  } catch (error) {
    return fail(error, 400);
  }
}
