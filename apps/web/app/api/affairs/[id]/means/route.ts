import { fail, handleAffairMeans } from "../../../../../lib/api";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const body = await request.json();
    const { id } = await params;
    return await handleAffairMeans(id, body);
  } catch (error) {
    return fail(error, 400);
  }
}
