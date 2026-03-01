import { fail, handleSourceMap } from "../../../lib/api";

export async function GET() {
  try {
    return await handleSourceMap();
  } catch (error) {
    return fail(error, 500);
  }
}
