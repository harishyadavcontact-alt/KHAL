import { fail } from "../../../../../lib/api";
import { handleDomainPnLLadderGet, handleDomainPnLLadderPut } from "../../../../../lib/api/doctrine";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    return await handleDomainPnLLadderGet(id);
  } catch (error) {
    return fail(error, 500);
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    return await handleDomainPnLLadderPut(id, body);
  } catch (error) {
    return fail(error, 400);
  }
}
