import { fail } from "../../../../../../lib/api/shared";
import { handleSourceMapStateOfAffairs } from "../../../../../../lib/api/source-map";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const body = await request.json();
    const { id } = await params;
    return await handleSourceMapStateOfAffairs(id, body);
  } catch (error) {
    return fail(error, 400);
  }
}
