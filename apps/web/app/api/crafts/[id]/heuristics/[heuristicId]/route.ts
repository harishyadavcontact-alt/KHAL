import { fail, handleCraftEntity } from "../../../../../../lib/api";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string; heuristicId: string }> }) {
  try {
    const body = await request.json();
    const { id, heuristicId } = await params;
    return await handleCraftEntity(id, "heuristics", body, heuristicId);
  } catch (error) {
    return fail(error, 400);
  }
}
