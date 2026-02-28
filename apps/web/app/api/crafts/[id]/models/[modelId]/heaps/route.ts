import { fail, handleCraftLinks } from "../../../../../../../lib/api";

export async function PUT(request: Request, { params }: { params: Promise<{ modelId: string }> }) {
  try {
    const body = (await request.json()) as { heapIds?: string[] };
    const { modelId } = await params;
    return await handleCraftLinks("craft_model_heap_links", "model_id", modelId, "heap_id", body.heapIds ?? []);
  } catch (error) {
    return fail(error, 400);
  }
}
