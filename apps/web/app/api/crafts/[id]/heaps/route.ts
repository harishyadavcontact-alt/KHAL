import { fail, handleCraftEntity } from "../../../../../lib/api";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const body = await request.json();
    const { id } = await params;
    return await handleCraftEntity(id, "heaps", body);
  } catch (error) {
    return fail(error, 400);
  }
}
