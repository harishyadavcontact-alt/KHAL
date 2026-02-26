import { fail, handleInterest } from "../../../lib/api";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    return await handleInterest(body);
  } catch (error) {
    return fail(error, 400);
  }
}