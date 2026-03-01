import { fail, handleLineageRiskCreate, handleLineageRisks } from "../../../lib/api";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    return await handleLineageRisks({
      sourceId: url.searchParams.get("sourceId") ?? undefined,
      domainId: url.searchParams.get("domainId") ?? undefined,
      lineageNodeId: url.searchParams.get("lineageNodeId") ?? undefined,
      actorType: url.searchParams.get("actorType") ?? undefined,
      status: url.searchParams.get("status") ?? undefined
    });
  } catch (error) {
    return fail(error, 500);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    return await handleLineageRiskCreate(body);
  } catch (error) {
    return fail(error, 400);
  }
}
