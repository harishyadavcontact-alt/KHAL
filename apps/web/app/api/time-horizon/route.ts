import { fail, handleTimeHorizonGet } from "../../../lib/api";

export async function GET() {
  try {
    return await handleTimeHorizonGet("default_operator");
  } catch (error) {
    return fail(error, 500);
  }
}
