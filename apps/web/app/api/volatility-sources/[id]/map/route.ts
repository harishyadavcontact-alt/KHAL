import { fail } from "../../../../../lib/api";
import { handleSourceMapGet, handleSourceMapPut } from "../../../../../lib/api/source-map";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await context.params;
    return await handleSourceMapGet(params.id);
  } catch (error) {
    return fail(error, 500);
  }
}

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await context.params;
    return await handleSourceMapPut(params.id, await request.json());
  } catch (error) {
    return fail(error, 500);
  }
}
