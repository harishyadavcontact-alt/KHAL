import { fail, handleTask } from "../../../lib/api";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    return await handleTask(body);
  } catch (error) {
    return fail(error, 400);
  }
}