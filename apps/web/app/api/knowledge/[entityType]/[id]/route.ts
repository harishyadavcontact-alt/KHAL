import { fail, handleKnowledgeById, handleKnowledgeDelete, handleKnowledgePatch } from "../../../../../lib/api";

export async function GET(_request: Request, { params }: { params: Promise<{ entityType: string; id: string }> }) {
  try {
    const { entityType, id } = await params;
    return await handleKnowledgeById(entityType, id);
  } catch (error) {
    return fail(error, 400);
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ entityType: string; id: string }> }) {
  try {
    const body = await request.json();
    const { entityType, id } = await params;
    return await handleKnowledgePatch(entityType, id, body);
  } catch (error) {
    return fail(error, 400);
  }
}


export async function DELETE(_request: Request, { params }: { params: Promise<{ entityType: string; id: string }> }) {
  try {
    const { entityType, id } = await params;
    return await handleKnowledgeDelete(entityType, id);
  } catch (error) {
    return fail(error, 400);
  }
}
