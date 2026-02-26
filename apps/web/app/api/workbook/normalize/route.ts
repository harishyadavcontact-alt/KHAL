import { fail, handleNormalize } from "../../../../lib/api";

export async function POST() {
  try {
    return await handleNormalize();
  } catch (error) {
    return fail(error, 400);
  }
}