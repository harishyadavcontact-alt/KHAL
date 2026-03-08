import { fail } from "../../../../../lib/api";
import { handlePortfolioShipLogCreate } from "../../../../../lib/portfolio/store";

export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const body = await request.json();
    const { slug } = await params;
    return await handlePortfolioShipLogCreate(slug, body);
  } catch (error) {
    return fail(error, 400);
  }
}
