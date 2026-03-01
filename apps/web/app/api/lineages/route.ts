import { fail, handleLineageEntityCreate, handleLineageNodeCreate, handleLineages } from "../../../lib/api";

export async function GET() {
  try {
    return await handleLineages();
  } catch (error) {
    return fail(error, 500);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (body?.kind === "entity") return await handleLineageEntityCreate(body);
    return await handleLineageNodeCreate(body);
  } catch (error) {
    return fail(error, 400);
  }
}
