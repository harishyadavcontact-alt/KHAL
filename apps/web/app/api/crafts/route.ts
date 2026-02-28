import { fail, handleCraft, handleCrafts } from "../../../lib/api";

export async function GET() {
  try {
    return await handleCrafts();
  } catch (error) {
    return fail(error, 500);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    return await handleCraft(body);
  } catch (error) {
    return fail(error, 400);
  }
}
