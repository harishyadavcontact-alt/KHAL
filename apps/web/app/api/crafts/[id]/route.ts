import { fail, handleCraft, handleCraftById } from "../../../../lib/api";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    return await handleCraftById(id);
  } catch (error) {
    return fail(error, 500);
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const body = await request.json();
    const { id } = await params;
    return await handleCraft(body, id);
  } catch (error) {
    return fail(error, 400);
  }
}
