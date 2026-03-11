import { fail, handleData } from "../../../lib/api";

export async function GET() {
  try {
    return await handleData();
  } catch (error) {
    return fail(error, 500);
  }
}
