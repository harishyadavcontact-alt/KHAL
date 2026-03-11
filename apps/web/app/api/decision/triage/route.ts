import { z } from "zod";
import { fail, ok, withDb } from "../../../../lib/api";
import { evaluateDecisionWithTriage } from "../../../../lib/decision-spec";
import { loadRuntimeProjection } from "../../../../lib/runtime/authority";
import { loadSourceMapProfiles } from "../../../../lib/api/source-map";
import { loadWarGameDoctrineChains } from "../../../../lib/api/wargaming-doctrine";

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
      const sourceMapProfiles = loadSourceMapProfiles(db);
      const responseLogic = loadWarGameDoctrineChains(db);
      const result = evaluateDecisionWithTriage({
        mode: parsed.mode,
        targetId: parsed.targetId,
        role: parsed.role,
        noRuinGate: parsed.noRuinGate,
        overrides: parsed.overrides,
        state: projection.state,
        sourceMapProfiles,
        responseLogic
      });
      return ok({ ...result, runtimeInvariants: projection.runtimeInvariants.summary });
    });
  } catch (error) {
    return fail(error, 400);
  }
}
