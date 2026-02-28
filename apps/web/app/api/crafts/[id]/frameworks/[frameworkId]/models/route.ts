import { fail, handleCraftLinks } from "../../../../../../../lib/api";

export async function PUT(request: Request, { params }: { params: Promise<{ frameworkId: string }> }) {
  try {
    const body = (await request.json()) as { modelIds?: string[] };
    const { frameworkId } = await params;
    return await handleCraftLinks("craft_framework_model_links", "framework_id", frameworkId, "model_id", body.modelIds ?? []);
  } catch (error) {
    return fail(error, 400);
  }
}
