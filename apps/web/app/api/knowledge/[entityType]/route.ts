import { fail, handleKnowledgeCollection, handleKnowledgeCreate } from "../../../../lib/api";

export async function GET(_request: Request, { params }: { params: Promise<{ entityType: string }> }) {
  try {
    const { entityType } = await params;
    return await handleKnowledgeCollection(entityType);
  } catch (error) {
    return fail(error, 400);
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ entityType: string }> }) {
  try {
    const body = await request.json();
    const { entityType } = await params;
    return await handleKnowledgeCreate(entityType, body);
  } catch (error) {
    return fail(error, 400);
  }
}
