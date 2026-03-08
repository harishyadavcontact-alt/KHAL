import { fail } from "../../../../lib/api";
import { handlePortfolioBySlug, handlePortfolioPatch } from "../../../../lib/portfolio/store";

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    return await handlePortfolioBySlug(slug);
  } catch (error) {
    return fail(error, 400);
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const body = await request.json();
    const { slug } = await params;
    return await handlePortfolioPatch(slug, body);
  } catch (error) {
    return fail(error, 400);
  }
}
