import { fail, handleVolatilitySources, handleVolatilitySourcesPost } from "../../../lib/api";

export async function GET() {
  try {
    return await handleVolatilitySources();
  } catch (error) {
    return fail(error, 500);
  }
}

export async function POST(request: Request) {
  try {
    return await handleVolatilitySourcesPost(await request.json());
  } catch (error) {
    return fail(error, 500);
  }
}
