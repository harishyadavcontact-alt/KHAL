import { z } from "zod";
import { fail, ok, withDb, withStore } from "../../../../../lib/api";
import { commitAgentMutations } from "../../../../../lib/agent/wargame";
import { evaluateDecision } from "../../../../../lib/decision-spec";
import { loadState } from "@khal/sync-engine";

const schema = z.object({
  dryRunId: z.string(),
  acceptedMutations: z.array(z.record(z.unknown())),
  mode: z.enum(["source", "domain", "affair", "interest", "craft", "lineage", "mission"]).optional(),
  targetId: z.string().optional(),
  role: z.enum(["MISSIONARY", "VISIONARY"]).optional(),
  noRuinGate: z.boolean().optional()
});

export async function POST(request: Request) {
  try {
    const parsed = schema.parse(await request.json());
    const dryRunRow = await withDb((db) =>
      db.prepare("SELECT id, status FROM agent_dry_runs WHERE id=?").get(parsed.dryRunId) as { id: string; status: string } | undefined
    );
    if (!dryRunRow) return ok({ error: "Dry run not found" }, 404);
    if (dryRunRow.status !== "PENDING") return ok({ error: "Dry run already committed/expired" }, 409);

    const commitResult = await withStore((dbPath) =>
      commitAgentMutations({
        dbPath,
        acceptedMutations: parsed.acceptedMutations as Array<Record<string, unknown>>
      })
    );
    await withDb((db) => {
      db.prepare("UPDATE agent_dry_runs SET status='COMMITTED', committed_at=datetime('now') WHERE id=?").run(parsed.dryRunId);
    });

    const postEval = await withStore((dbPath) => {
      const loaded = loadState(dbPath);
      const mode = parsed.mode ?? "mission";
      const targetId = parsed.targetId ?? "mission-global";
      return evaluateDecision({
        mode,
        targetId,
        role: parsed.role,
        noRuinGate: parsed.noRuinGate,
        state: loaded.state
      });
    });

    return ok({
      dryRunId: parsed.dryRunId,
      commitResult,
      evaluation: postEval
    });
  } catch (error) {
    return fail(error, 400);
  }
}
