import { fail } from "../../../../lib/api";
import { handlePlansPatch } from "../../../../lib/api/plans";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    return await handlePlansPatch(id, body);
  } catch (error) {
    return fail(error, 400);
  }
}
