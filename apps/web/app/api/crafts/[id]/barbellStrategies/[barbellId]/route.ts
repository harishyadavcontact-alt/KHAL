import { fail, handleCraftEntity } from "../../../../../../lib/api";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string; barbellId: string }> }) {
  try {
    const body = await request.json();
    const { id, barbellId } = await params;
    return await handleCraftEntity(id, "barbell-strategies", body, barbellId);
  } catch (error) {
    return fail(error, 400);
  }
}
