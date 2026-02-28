import { fail, handleCraftEntity } from "../../../../../../lib/api";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string; heapId: string }> }) {
  try {
    const body = await request.json();
    const { id, heapId } = await params;
    return await handleCraftEntity(id, "heaps", body, heapId);
  } catch (error) {
    return fail(error, 400);
  }
}
