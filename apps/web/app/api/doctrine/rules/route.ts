import { fail } from "../../../../lib/api";
import { handleDoctrineRuleCreate, handleDoctrineRulesGet } from "../../../../lib/api/doctrine";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const rulebookId = url.searchParams.get("rulebookId") ?? undefined;
    const stage = url.searchParams.get("stage") ?? undefined;
    const severity = url.searchParams.get("severity") ?? undefined;
    const kind = url.searchParams.get("kind") ?? undefined;
    return await handleDoctrineRulesGet(rulebookId, stage, severity, kind);
  } catch (error) {
    return fail(error, 500);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    return await handleDoctrineRuleCreate(body);
  } catch (error) {
    return fail(error, 400);
  }
}
