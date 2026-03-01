import { fail, handleVolatilitySources } from "../../../lib/api";

export async function GET() {
  try {
    return await handleVolatilitySources();
  } catch (error) {
    return fail(error, 500);
  }
}
