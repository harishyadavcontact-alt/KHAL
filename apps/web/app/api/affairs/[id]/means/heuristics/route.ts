import { fail, handleAffairMeans } from "../../../../../../lib/api";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const body = (await request.json()) as { selectedHeuristicIds?: string[]; craftId?: string };
    const { id } = await params;
    return await handleAffairMeans(id, {
      craftId: body.craftId ?? "general",
      selectedHeuristicIds: body.selectedHeuristicIds ?? []
    });
  } catch (error) {
    return fail(error, 400);
  }
}
