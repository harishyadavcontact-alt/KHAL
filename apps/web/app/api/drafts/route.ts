import { fail } from "../../../lib/api";
import { handleDraftLatest, handleDraftSave } from "../../../lib/drafts/store";

export async function GET() {
  try {
    return await handleDraftLatest();
  } catch (error) {
    return fail(error, 400);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    return await handleDraftSave(body);
  } catch (error) {
    return fail(error, 400);
  }
}
