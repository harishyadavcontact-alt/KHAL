import { fail } from "../../../../../lib/api";
import { handleDoctrineRulePatch } from "../../../../../lib/api/doctrine";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    return await handleDoctrineRulePatch(id, body);
  } catch (error) {
    return fail(error, 400);
  }
}
