import { fail, handleLineageNodeCreate } from "../../../../lib/api";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    return await handleLineageNodeCreate(body);
  } catch (error) {
    return fail(error, 400);
  }
}
