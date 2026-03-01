import { fail, handleLineageRiskPatch } from "../../../../lib/api";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    return await handleLineageRiskPatch(id, body);
  } catch (error) {
    return fail(error, 400);
  }
}
