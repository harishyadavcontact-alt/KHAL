import { fail } from "../../../../lib/api";
import { handleMissionCommandBootstrapGet } from "../../../../lib/api/mission-command";

export async function GET() {
  try {
    return await handleMissionCommandBootstrapGet();
  } catch (error) {
    return fail(error, 500);
  }
}
