import { fail, handleInterest } from "../../../../lib/api";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const body = await request.json();
    const { id } = await params;
    return await handleInterest({ ...body, id });
  } catch (error) {
    return fail(error, 400);
  }
}