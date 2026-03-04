import { randomUUID } from "node:crypto";
import { loadState, writeAffair, writeInterest, writeTask } from "@khal/sync-engine";
import type { WarGameModeSpec } from "../decision-spec/schema";
import { buildDraftMutations, evaluateDecision } from "../decision-spec";

export type AgentDryRunInput = {
  mode: WarGameModeSpec;
  targetId?: string;
  prompt: string;
  role?: "MISSIONARY" | "VISIONARY";
  noRuinGate?: boolean;
};

export function createAgentDryRun(args: { dbPath: string; input: AgentDryRunInput }) {
  const loaded = loadState(args.dbPath);
  const targetId = args.input.targetId ?? "global";
  const evaluation = evaluateDecision({
    mode: args.input.mode,
    targetId,
    state: loaded.state,
    role: args.input.role ?? "MISSIONARY",
    noRuinGate: args.input.noRuinGate ?? true
  });
  const proposedMutations = buildDraftMutations({
    mode: args.input.mode,
    targetId: args.input.targetId,
    prompt: args.input.prompt,
    state: loaded.state
  });
  return {
    id: randomUUID(),
    mode: args.input.mode,
    targetId,
    prompt: args.input.prompt,
    evaluation,
    proposedMutations
  };
}

export function commitAgentMutations(args: {
  dbPath: string;
  acceptedMutations: Array<Record<string, unknown>>;
}) {
  const loaded = loadState(args.dbPath);
  const tasks = [...loaded.state.tasks];
  const results: Array<Record<string, unknown>> = [];

  for (const mutation of args.acceptedMutations) {
    const kind = String(mutation.kind ?? "");
    const payload = (mutation.payload ?? {}) as Record<string, unknown>;
    if (kind === "CREATE_AFFAIR") {
      const id = String(payload.id ?? randomUUID());
      const row = writeAffair(args.dbPath, {
        id,
        title: String(payload.title ?? "Agent Affair"),
        domainId: String(payload.domainId ?? "general"),
        stakes: Number(payload.stakes ?? 5),
        risk: Number(payload.risk ?? 5),
        status: String(payload.status ?? "NOT_STARTED") as any
      });
      results.push({ kind, id: row.id });
      continue;
    }
    if (kind === "CREATE_INTEREST") {
      const id = String(payload.id ?? randomUUID());
      const row = writeInterest(args.dbPath, {
        id,
        title: String(payload.title ?? "Agent Interest"),
        domainId: String(payload.domainId ?? "general"),
        stakes: Number(payload.stakes ?? 5),
        risk: Number(payload.risk ?? 5),
        convexity: Number(payload.convexity ?? 5),
        status: String(payload.status ?? "NOT_STARTED") as any,
        labStage: String(payload.labStage ?? "FORGE") as any,
        hedgePct: Number(payload.hedgePct ?? 90),
        edgePct: Number(payload.edgePct ?? 10)
      });
      results.push({ kind, id: row.id });
      continue;
    }
    if (kind === "CREATE_TASK") {
      const id = String(payload.id ?? randomUUID());
      const row = writeTask(
        args.dbPath,
        {
          id,
          title: String(payload.title ?? "Agent Task"),
          sourceType: String(payload.sourceType ?? "PLAN") as any,
          sourceId: String(payload.sourceId ?? "mission-global"),
          horizon: String(payload.horizon ?? "WEEK") as any,
          status: String(payload.status ?? "NOT_STARTED") as any
        },
        tasks
      );
      tasks.push(row);
      results.push({ kind, id: row.id });
    }
  }
  return {
    committedCount: results.length,
    results
  };
}
