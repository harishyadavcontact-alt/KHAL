import { fail, handleCraftLinks } from "../../../../../../../lib/api";

export async function PUT(request: Request, { params }: { params: Promise<{ barbellId: string }> }) {
  try {
    const body = (await request.json()) as { frameworkIds?: string[] };
    const { barbellId } = await params;
    return await handleCraftLinks("craft_barbell_framework_links", "barbell_id", barbellId, "framework_id", body.frameworkIds ?? []);
  } catch (error) {
    return fail(error, 400);
  }
}
