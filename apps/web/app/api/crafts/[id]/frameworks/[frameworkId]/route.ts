import { fail, handleCraftEntity } from "../../../../../../lib/api";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string; frameworkId: string }> }) {
  try {
    const body = await request.json();
    const { id, frameworkId } = await params;
    return await handleCraftEntity(id, "frameworks", body, frameworkId);
  } catch (error) {
    return fail(error, 400);
  }
}
