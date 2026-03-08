import { randomUUID } from "node:crypto";
import { fail, ok, withStore } from "../../../../../lib/api";
import { writeTask } from "@khal/sync-engine";
import { loadRuntimeProjection } from "../../../../../lib/runtime/authority";

export async function POST(_: Request, { params }: { params: Promise<{ endId: string }> }) {
  try {
    const { endId } = await params;

    return await withStore((dbPath) => {
      const projection = loadRuntimeProjection({ dbPath });
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
          projection.state.tasks
        )
      );

      return ok({ createdCount: created.length, created, runtimeInvariants: projection.runtimeInvariants.summary }, 201);
    });
  } catch (error) {
    return fail(error, 400);
  }
}
