import { fail, handleTimeHorizonProfile } from "../../../../lib/api";

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    return await handleTimeHorizonProfile(body, "default_operator");
  } catch (error) {
    return fail(error, 400);
  }
}
