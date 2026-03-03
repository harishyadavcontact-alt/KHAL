import { fail, handleData, ok } from "../../../lib/api";
import { mockAppData } from "../../../lib/war-room/mock-app-data";

export async function GET() {
  try {
    if (process.env.NEXT_PUBLIC_FRONTEND_ONLY === "1") {
      return ok(mockAppData);
    }
    return await handleData();
  } catch (error) {
    return fail(error, 500);
  }
}
