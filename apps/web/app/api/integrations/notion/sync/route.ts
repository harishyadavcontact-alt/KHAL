import { z } from "zod";
import { fail, ok, withDb } from "../../../../../lib/api";
import { syncSecondBrain } from "../../../../../lib/integrations/second-brain";

const artifactSchema = z.object({
  externalId: z.string().min(1),
  artifactType: z.enum(["HEAP", "MODEL", "FRAMEWORK", "BARBELL", "HEURISTIC"]),
  title: z.string().min(1),
  uri: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
  linkedEntityType: z.enum(["craft", "domain", "affair", "interest", "mission", "lineage"]).optional(),
  linkedEntityId: z.string().optional()
});

const schema = z.object({
  operationType: z.enum(["READ", "WRITE"]),
  dryRun: z.boolean().optional(),
  confirm: z.boolean().optional(),
  artifacts: z.array(artifactSchema).optional()
});

export async function POST(request: Request) {
  try {
    const parsed = schema.parse(await request.json());
    return withDb((db) =>
      ok(
        syncSecondBrain(db, {
          provider: "NOTION",
          operationType: parsed.operationType,
          dryRun: parsed.dryRun,
          confirm: parsed.confirm,
          artifacts: parsed.artifacts
        })
      )
    );
  } catch (error) {
    return fail(error, 400);
  }
}
