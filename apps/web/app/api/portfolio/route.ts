import { fail } from "../../../lib/api";
import { handlePortfolioCreate, handlePortfolioList } from "../../../lib/portfolio/store";

export async function GET() {
  try {
    return await handlePortfolioList();
  } catch (error) {
    return fail(error, 400);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    return await handlePortfolioCreate(body);
  } catch (error) {
    return fail(error, 400);
  }
}
