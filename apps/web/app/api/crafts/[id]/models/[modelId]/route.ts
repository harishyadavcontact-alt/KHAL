import { fail, handleCraftEntity } from "../../../../../../lib/api";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string; modelId: string }> }) {
  try {
    const body = await request.json();
    const { id, modelId } = await params;
    return await handleCraftEntity(id, "models", body, modelId);
  } catch (error) {
    return fail(error, 400);
  }
}
