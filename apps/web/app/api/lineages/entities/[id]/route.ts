import { fail, handleLineageEntityPatch } from "../../../../../lib/api";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    return await handleLineageEntityPatch(id, body);
  } catch (error) {
    return fail(error, 400);
  }
}
