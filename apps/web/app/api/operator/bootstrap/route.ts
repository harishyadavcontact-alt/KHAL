import { fail } from "../../../../lib/api";
import { handleOperatorBootstrapGet, handleOperatorBootstrapPost } from "../../../../lib/api/operator";

export async function GET() {
  try {
    return await handleOperatorBootstrapGet();
  } catch (error) {
    return fail(error, 500);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    return await handleOperatorBootstrapPost(body);
  } catch (error) {
    return fail(error, 500);
  }
}
