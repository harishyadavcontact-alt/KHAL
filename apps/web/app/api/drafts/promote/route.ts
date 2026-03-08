import { fail } from "../../../../lib/api";
import { handleDraftPromote } from "../../../../lib/drafts/store";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    return await handleDraftPromote(body);
  } catch (error) {
    return fail(error, 400);
  }
}
