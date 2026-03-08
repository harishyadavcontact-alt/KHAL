import { z } from "zod";
import { fail, ok, withStore } from "../../../../lib/api";
import { evaluateDecisionWithTriage } from "../../../../lib/decision-spec";
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
    return withStore((dbPath) => {
      const projection = loadRuntimeProjection({ dbPath });
      const result = evaluateDecisionWithTriage({
        mode: parsed.mode,
        targetId: parsed.targetId,
        role: parsed.role,
        noRuinGate: parsed.noRuinGate,
        overrides: parsed.overrides,
        state: projection.state
      });
      return ok({ ...result, runtimeInvariants: projection.runtimeInvariants.summary });
    });
  } catch (error) {
    return fail(error, 400);
  }
}
