import { randomUUID } from "node:crypto";
import { fail, ok, withStore } from "../../../../../lib/api";
import { loadState, writeTask } from "@khal/sync-engine";

export async function POST(_: Request, { params }: { params: Promise<{ endId: string }> }) {
  try {
    const { endId } = await params;

    return await withStore((dbPath) => {
      const loaded = loadState(dbPath);
      const created = [1, 2, 3].map((step) =>
        writeTask(
          dbPath,
          {
            id: randomUUID(),
            sourceType: "PLAN",
            sourceId: endId,
            title: `Generated task ${step} for ${endId}`,
            horizon: step === 1 ? "WEEK" : step === 2 ? "MONTH" : "QUARTER",
            status: "NOT_STARTED"
          },
          loaded.state.tasks
        )
      );

      return ok({ createdCount: created.length, created }, 201);
    });
  } catch (error) {
    return fail(error, 400);
  }
}
