import { fail, handleRefresh } from "../../../../lib/api";

export async function POST() {
  try {
    return await handleRefresh();
  } catch (error) {
    return fail(error, 500);
  }
}