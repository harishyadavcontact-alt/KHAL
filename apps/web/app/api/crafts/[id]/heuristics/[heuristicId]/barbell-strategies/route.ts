import { fail, handleCraftLinks } from "../../../../../../../lib/api";

export async function PUT(request: Request, { params }: { params: Promise<{ heuristicId: string }> }) {
  try {
    const body = (await request.json()) as { barbellStrategyIds?: string[] };
    const { heuristicId } = await params;
    return await handleCraftLinks("craft_heuristic_barbell_links", "heuristic_id", heuristicId, "barbell_id", body.barbellStrategyIds ?? []);
  } catch (error) {
    return fail(error, 400);
  }
}
