import { fail } from "../../../../lib/api";
import { handleDoctrineRulebooksGet } from "../../../../lib/api/doctrine";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const scopeType = url.searchParams.get("scopeType") ?? undefined;
    const scopeRef = url.searchParams.get("scopeRef") ?? undefined;
    const mode = url.searchParams.get("mode") ?? undefined;
    return await handleDoctrineRulebooksGet(scopeType, scopeRef, mode);
  } catch (error) {
    return fail(error, 500);
  }
}
