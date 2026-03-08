import { fail, ok, withDb } from "../../../lib/api";
import { loadRuntimeProjection } from "../../../lib/runtime/authority";

export async function GET() {
  try {
    return withDb((db, dbPath) => {
      const projection = loadRuntimeProjection({ db, dbPath });
      return ok(projection.runtimeInvariants);
    });
  } catch (error) {
    return fail(error, 500);
  }
}
