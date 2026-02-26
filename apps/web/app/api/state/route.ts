import { fail, handleState } from "../../../lib/api";

export async function GET() {
  try {
    return await handleState();
  } catch (error) {
    return fail(error, 500);
  }
}