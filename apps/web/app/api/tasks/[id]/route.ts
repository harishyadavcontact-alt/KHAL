import { fail, handleTask } from "../../../../lib/api";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const body = await request.json();
    const { id } = await params;
    return await handleTask({ ...body, id });
  } catch (error) {
    return fail(error, 400);
  }
}