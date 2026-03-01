import { fail, handleCalendarIcs } from "../../../../lib/api";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const horizon = url.searchParams.get("horizon") ?? undefined;
    return await handleCalendarIcs({ horizon });
  } catch (error) {
    return fail(error, 500);
  }
}

