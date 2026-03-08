import { fail } from "../../../../lib/api";
import { handleDraftById } from "../../../../lib/drafts/store";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    return await handleDraftById(id);
  } catch (error) {
    return fail(error, 400);
  }
}
