import { fail, handleLineageEntityCreate } from "../../../../lib/api";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    return await handleLineageEntityCreate(body);
  } catch (error) {
    return fail(error, 400);
  }
}
