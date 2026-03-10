import { fail } from "../../../../lib/api";
import { handleWarGamingBootstrapGet } from "../../../../lib/api/wargaming";

export async function GET() {
  try {
    return await handleWarGamingBootstrapGet();
  } catch (error) {
    return fail(error, 500);
  }
}
