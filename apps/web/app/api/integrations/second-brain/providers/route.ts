import { z } from "zod";
import { fail, ok, withDb } from "../../../../../lib/api";
import { listIntegrationProviders, upsertIntegrationProvider } from "../../../../../lib/integrations/second-brain";

const schema = z.object({
  provider: z.enum(["OBSIDIAN", "NOTION"]),
  label: z.string().min(1),
  config: z.record(z.unknown()).optional(),
  active: z.boolean().optional()
});

export async function GET() {
  try {
    return withDb((db) => ok(listIntegrationProviders(db)));
  } catch (error) {
    return fail(error, 500);
  }
}

export async function POST(request: Request) {
  try {
    const parsed = schema.parse(await request.json());
    return withDb((db) => ok(upsertIntegrationProvider(db, parsed), 201));
  } catch (error) {
    return fail(error, 400);
  }
}
