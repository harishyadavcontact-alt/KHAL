import { fail, handleMissionCommandBootstrap } from "../../../../lib/api";

export async function GET() {
  try {
    return await handleMissionCommandBootstrap();
  } catch (error) {
    return fail(error, 500);
  }
}
