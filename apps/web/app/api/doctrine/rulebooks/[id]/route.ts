import { fail } from "../../../../../lib/api";
import { handleDoctrineRulebookPut } from "../../../../../lib/api/doctrine";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    return await handleDoctrineRulebookPut(id, body);
  } catch (error) {
    return fail(error, 400);
  }
}
