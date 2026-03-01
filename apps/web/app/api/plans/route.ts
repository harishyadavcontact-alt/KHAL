import { fail } from "../../../lib/api";
import { handlePlansCreate, handlePlansGet } from "../../../lib/api/plans";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const sourceType = url.searchParams.get("sourceType") ?? undefined;
    const sourceId = url.searchParams.get("sourceId") ?? undefined;
    return await handlePlansGet(sourceType, sourceId);
  } catch (error) {
    return fail(error, 500);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    return await handlePlansCreate(body);
  } catch (error) {
    return fail(error, 400);
  }
}
