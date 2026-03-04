import { fail, ok } from "../../../lib/api";
import { getDecisionSpec } from "../../../lib/decision-spec";

export async function GET() {
  try {
    return ok(getDecisionSpec());
  } catch (error) {
    return fail(error, 500);
  }
}
