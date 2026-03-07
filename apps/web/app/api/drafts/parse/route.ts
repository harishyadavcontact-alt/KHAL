import { fail, ok } from "../../../../lib/api";
import { inferDraftStructure } from "../../../../lib/drafts/parser";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { input?: string };
    return ok(inferDraftStructure(body.input ?? ""));
  } catch (error) {
    return fail(error, 400);
  }
}
