import { z } from "zod";
import { fail, ok, withDb, withStore } from "../../../../../lib/api";
import { commitAgentMutations } from "../../../../../lib/agent/wargame";
import { evaluateDecision } from "../../../../../lib/decision-spec";
import { loadRuntimeProjection } from "../../../../../lib/runtime/authority";

const schema = z.object({
  dryRunId: z.string(),
  acceptedMutations: z.array(z.record(z.unknown())),
  mode: z.enum(["source", "domain", "affair", "interest", "craft", "lineage", "mission"]).optional(),
  targetId: z.string().optional(),
  role: z.enum(["MISSIONARY", "VISIONARY"]).optional(),
  noRuinGate: z.boolean().optional()
});

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => canonicalize(item));
  }
  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>).sort(([left], [right]) => left.localeCompare(right));
    return Object.fromEntries(entries.map(([key, item]) => [key, canonicalize(item)]));
  }
  return value;
}

function toMutationSignature(value: unknown): string {
  return JSON.stringify(canonicalize(value));
}

export async function POST(request: Request) {
  try {
    const parsed = schema.parse(await request.json());
    const dryRunRow = await withDb((db) =>
      db
        .prepare("SELECT id, status, proposed_mutations_json FROM agent_dry_runs WHERE id=?")
        .get(parsed.dryRunId) as { id: string; status: string; proposed_mutations_json: string | null } | undefined
    );
    if (!dryRunRow) return ok({ error: "Dry run not found" }, 404);
    if (dryRunRow.status !== "PENDING") return ok({ error: "Dry run already committed/expired" }, 409);

    const proposedMutations = (() => {
      try {
        const raw = JSON.parse(String(dryRunRow.proposed_mutations_json ?? "[]"));
        return Array.isArray(raw) ? raw : [];
      } catch {
        return [];
      }
    })();
    const proposedSignatures = new Set(proposedMutations.map((item) => toMutationSignature(item)));
    const invalidMutations = parsed.acceptedMutations.filter((mutation) => !proposedSignatures.has(toMutationSignature(mutation)));
    if (invalidMutations.length > 0) {
      return ok(
        {
          error: "Accepted mutations must be a subset of dry-run proposals",
          invalidMutationCount: invalidMutations.length
        },
        400
      );
    }

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
      const projection = loadRuntimeProjection({ dbPath });
      const mode = parsed.mode ?? "mission";
      const targetId = parsed.targetId ?? "mission-global";
      const evaluation = evaluateDecision({
        mode,
        targetId,
        role: parsed.role,
        noRuinGate: parsed.noRuinGate,
        state: projection.state
      });
      return { evaluation, runtimeInvariants: projection.runtimeInvariants.summary };
    });

    return ok({
      dryRunId: parsed.dryRunId,
      commitResult,
      evaluation: postEval.evaluation,
      runtimeInvariants: postEval.runtimeInvariants
    });
  } catch (error) {
    return fail(error, 400);
  }
}
