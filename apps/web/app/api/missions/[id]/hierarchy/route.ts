import { fail, handleMissionHierarchyGet, handleMissionHierarchyPut } from "../../../../../lib/api";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    return await handleMissionHierarchyGet(id);
  } catch (error) {
    return fail(error, 500);
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    return await handleMissionHierarchyPut(id, body);
  } catch (error) {
    return fail(error, 400);
  }
}

