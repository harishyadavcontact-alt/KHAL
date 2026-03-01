import { fail, handleDomainStrategyGet, handleDomainStrategyPut } from "../../../../../lib/api";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    return await handleDomainStrategyGet(id);
  } catch (error) {
    return fail(error, 500);
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    return await handleDomainStrategyPut(id, body);
  } catch (error) {
    return fail(error, 400);
  }
}
