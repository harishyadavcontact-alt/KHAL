import { fail, handleTimeHorizonDeadlineDelete, handleTimeHorizonDeadlineUpdate } from "../../../../../lib/api";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const body = await request.json();
    const { id } = await params;
    return await handleTimeHorizonDeadlineUpdate(id, body, "default_operator");
  } catch (error) {
    return fail(error, 400);
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    return await handleTimeHorizonDeadlineDelete(id, "default_operator");
  } catch (error) {
    return fail(error, 400);
  }
}
