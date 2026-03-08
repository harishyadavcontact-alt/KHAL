import { z } from "zod";
import { fail, ok, withDb, withStore } from "../../../../../lib/api";
import { createAgentDryRun } from "../../../../../lib/agent/wargame";

const schema = z.object({
  mode: z.enum(["source", "domain", "affair", "interest", "craft", "lineage", "mission"]),
  targetId: z.string().optional(),
  prompt: z.string().min(1),
  role: z.enum(["MISSIONARY", "VISIONARY"]).optional(),
  noRuinGate: z.boolean().optional()
});

export async function POST(request: Request) {
  try {
    const parsed = schema.parse(await request.json());
    const dryRun = await withStore((dbPath) =>
      createAgentDryRun({
        dbPath,
        input: parsed
      })
    );
    await withDb((db) => {
      db.prepare(
        `INSERT INTO agent_dry_runs
         (id, mode, target_id, prompt, payload_json, proposed_mutations_json, evaluation_json, status, expires_at, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'PENDING', datetime('now', '+1 day'), datetime('now'))`
      ).run(
        dryRun.id,
        dryRun.mode,
        dryRun.targetId ?? null,
        dryRun.prompt,
        JSON.stringify(parsed),
        JSON.stringify(dryRun.proposedMutations),
        JSON.stringify({ ...dryRun.evaluation, runtimeInvariants: dryRun.runtimeInvariants })
      );
    });
    return ok(dryRun, 201);
  } catch (error) {
    return fail(error, 400);
  }
}
