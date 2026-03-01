import { fail, handleTimeHorizonDeadlineCreate } from "../../../../lib/api";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    return await handleTimeHorizonDeadlineCreate(body, "default_operator");
  } catch (error) {
    return fail(error, 400);
  }
}
