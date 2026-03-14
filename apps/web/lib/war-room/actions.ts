import type {
  DomainStrategyDetailDto,
  Task,
  WarGameMode
} from "../../components/war-room-v2/types";
import type { WarGamingBootstrapData } from "./bootstrap";
import { modeToPlanSourceType } from "../decision-tree/registry";

type CreateTaskPayload = {
  id?: string;
  title: string;
  sourceType: string;
  sourceId: string;
  parentTaskId?: string;
  horizon?: string;
  dueDate?: string;
  notes?: string;
  dependencyIds?: string[];
  effortEstimate?: number;
};

type LineageRiskPayload = {
  id?: string;
  sourceId: string;
  domainId: string;
  lineageNodeId: string;
  actorType: "personal" | "private" | "public";
  title: string;
  exposure: number;
  dependency: number;
  irreversibility: number;
  optionality: number;
  responseTime: number;
  status: "OPEN" | "MITIGATING" | "RESOLVED" | "INCOMPLETE";
  notes?: string;
};

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Request failed: ${response.status}`);
  }
  return (await response.json()) as T;
}

const toApiTaskStatus = (status?: string) => {
  if (!status) return undefined;
  if (status === "not_started") return "NOT_STARTED";
  if (status === "in_progress") return "IN_PROGRESS";
  if (status === "done") return "DONE";
  if (status === "parked") return "PARKED";
  if (status === "waiting") return "WAITING";
  return status;
};

const ensureTaskSourceType = (sourceType?: string): "AFFAIR" | "INTEREST" | "PLAN" | "PREPARATION" => {
  if (sourceType === "AFFAIR" || sourceType === "INTEREST" || sourceType === "PLAN" || sourceType === "PREPARATION") return sourceType;
  return "PLAN";
};

export async function updateDomainStrategy(domainId: string, updates: Partial<DomainStrategyDetailDto>) {
  await requestJson(`/api/domains/${domainId}/strategy`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates)
  });
}

export async function createAffair(payload: { title: string; domainId: string }) {
  await requestJson("/api/affairs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: payload.title,
      domainId: payload.domainId,
      status: "NOT_STARTED",
      stakes: 5,
      risk: 5
    })
  });
}

export async function createInterest(payload: { title: string; domainId: string }) {
  await requestJson("/api/interests", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: payload.title,
      domainId: payload.domainId,
      status: "NOT_STARTED",
      stakes: 5,
      risk: 5,
      convexity: 5,
      labStage: "FORGE",
      hedgePct: 90,
      edgePct: 10
    })
  });
}

export async function updateInterest(
  id: string,
  payload: Partial<{
    title: string;
    domainId: string;
    stakes: number;
    risk: number;
    convexity: number;
    status: "NOT_STARTED" | "IN_PROGRESS" | "DONE" | "PARKED" | "WAITING";
    labStage: "FORGE" | "WIELD" | "TINKER";
    hypothesis: string;
    maxLossPct: number;
    expiryDate: string;
    killCriteria: string[];
    hedgePct: number;
    edgePct: number;
    irreversibility: number;
    evidenceNote: string;
  }>
) {
  await requestJson(`/api/interests/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
}

export async function updateAffairPlan(
  affairId: string,
  payload: { objectives: string[]; uncertainty?: string; timeHorizon?: string; lineageNodeId?: string; actorType?: "personal" | "private" | "public" }
) {
  await requestJson(`/api/affairs/${affairId}/plan`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  await requestJson("/api/plans", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sourceType: "AFFAIR",
      sourceId: affairId,
      title: `Affair Plan: ${affairId}`,
      lineageNodeId: payload.lineageNodeId,
      actorType: payload.actorType,
      criteria: payload.objectives.map((objective) => ({ name: "Objective", description: objective })),
      extras: {
        uncertainty: payload.uncertainty,
        timeHorizon: payload.timeHorizon
      }
    })
  });
}

export async function updateAffairMeans(affairId: string, payload: { craftId: string; selectedHeuristicIds: string[] }) {
  await requestJson(`/api/affairs/${affairId}/means`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
}

export async function createExecutionTask(payload: CreateTaskPayload) {
  await requestJson("/api/tasks", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id: payload.id,
      sourceType: ensureTaskSourceType(payload.sourceType),
      sourceId: payload.sourceId,
      parentTaskId: payload.parentTaskId,
      title: payload.title,
      notes: payload.notes,
      horizon: payload.horizon ?? "WEEK",
      dueDate: payload.dueDate,
      status: "NOT_STARTED",
      dependencyIds: payload.dependencyIds ?? [],
      effortEstimate: payload.effortEstimate
    })
  });
}

export async function updateExecutionTask(taskId: string, updates: Partial<Task>) {
  const payload: Record<string, unknown> = { ...updates };
  if (typeof payload.status === "string") {
    payload.status = toApiTaskStatus(payload.status);
  }
  await requestJson(`/api/tasks/${taskId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
}

export async function upsertLineageRisk(payload: LineageRiskPayload) {
  const url = payload.id ? `/api/lineage-risks/${payload.id}` : "/api/lineage-risks";
  const method = payload.id ? "PATCH" : "POST";
  return await requestJson(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
}

export async function saveWarGameProtocol(params: {
  payload: any;
  mode: WarGameMode;
  targetId?: string;
  data: Pick<WarGamingBootstrapData, "missionGraph">;
}) {
  const { payload, mode, targetId, data } = params;
  const sourceType = modeToPlanSourceType(mode);
  const resolvedTargetId = String(payload?.targetId ?? payload?.sourceId ?? targetId ?? "").trim();
  if (!resolvedTargetId) throw new Error("WarGame target is required.");

  const title = String(payload?.title ?? "").trim() || `WarGame ${sourceType}`;
  const cadence = payload?.cadence ?? "weekly";
  const scheduleEnd = payload?.targetDate || undefined;
  const criteria = Array.isArray(payload?.criteria)
    ? payload.criteria
    : Array.isArray(payload?.objectives)
      ? payload.objectives.map((objective: string) => ({ name: "ORK", description: objective }))
      : [];
  const thresholds = Array.isArray(payload?.thresholds)
    ? payload.thresholds
    : payload?.thresholdNotes
      ? [{ name: "KPI Threshold", value: String(payload.thresholdNotes) }]
      : [];
  const preparation =
    payload?.preparation && typeof payload.preparation === "object"
      ? payload.preparation
      : payload?.preparationNotes
        ? { notes: String(payload.preparationNotes) }
        : {};
  const extras =
    payload?.extras && typeof payload.extras === "object"
      ? payload.extras
      : {
          mode: sourceType,
          riskRewardSummary: payload?.riskRewardSummary ?? "",
          meansEndsMap: {
            means: payload?.meansText ?? "",
            ends: payload?.endsText ?? "",
            hedge: payload?.hedgeText ?? "",
            edge: payload?.edgeText ?? ""
          }
        };

  let riskRegisterIds: string[] = [];

  if (mode === "domain") {
    const domainUpdates: Record<string, string> = {};
    if (payload?.fragilityNarrative?.trim()) domainUpdates.fragilityText = payload.fragilityNarrative.trim();
    if (payload?.riskRewardSummary?.trim()) domainUpdates.risksText = payload.riskRewardSummary.trim();
    if (payload?.hedgeText?.trim()) domainUpdates.hedgeText = payload.hedgeText.trim();
    if (payload?.edgeText?.trim()) domainUpdates.edgeText = payload.edgeText.trim();
    if (payload?.meansText?.trim()) domainUpdates.heuristicsText = payload.meansText.trim();
    if (payload?.endsText?.trim()) domainUpdates.tacticsText = payload.endsText.trim();
    if (payload?.thresholdNotes?.trim()) domainUpdates.vulnerabilitiesText = payload.thresholdNotes.trim();
    if (Object.keys(domainUpdates).length > 0) {
      await updateDomainStrategy(resolvedTargetId, domainUpdates);
    }
  }

  if (mode === "affair") {
    await requestJson(`/api/affairs/${resolvedTargetId}/plan`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        objectives: Array.isArray(payload?.objectives) ? payload.objectives : [],
        uncertainty: payload?.fragilityNarrative ?? payload?.riskRewardSummary ?? "",
        timeHorizon: payload?.cadence ?? "weekly"
      })
    });
  }

  if (mode === "lineage") {
    if (!payload?.sourceId || !payload?.domainId) throw new Error("Lineage WarGame requires source and domain selection.");
    const risk = await upsertLineageRisk({
      sourceId: String(payload?.sourceId ?? ""),
      domainId: String(payload?.domainId ?? ""),
      lineageNodeId: String(payload?.lineageNodeId ?? resolvedTargetId),
      actorType: payload?.actorType ?? "personal",
      title,
      exposure: Number(payload?.exposure ?? 5),
      dependency: Number(payload?.dependency ?? 5),
      irreversibility: Number(payload?.irreversibility ?? 5),
      optionality: Number(payload?.optionality ?? 5),
      responseTime: Number(payload?.responseTime ?? 7),
      status: payload?.riskStatus ?? "INCOMPLETE",
      notes: payload?.riskNotes ?? payload?.fragilityNarrative ?? ""
    });
    if ((risk as { id?: string })?.id) riskRegisterIds = [(risk as { id: string }).id];
  }

  if (mode === "mission") {
    const missionId = resolvedTargetId;
    const missionNodesFromPayload = Array.isArray(payload?.missionHierarchy?.nodes) ? payload.missionHierarchy.nodes : null;
    const graphNodes =
      missionNodesFromPayload ??
      (data?.missionGraph?.nodes ?? [])
        .filter((node) => node.missionId === missionId && node.refType !== "MISSION")
        .map((node) => ({
          id: node.id,
          refType: node.refType,
          refId: node.refId,
          parentNodeId: node.parentNodeId,
          sortOrder: node.sortOrder,
          dependencyIds: [] as string[]
        }));
    const nodeIds = new Set(graphNodes.map((node: any) => String(node.id)));
    const dependencyMap = new Map<string, string[]>();
    for (const dep of data?.missionGraph?.dependencies ?? []) {
      if (!nodeIds.has(dep.missionNodeId) || !nodeIds.has(dep.dependsOnNodeId)) continue;
      const list = dependencyMap.get(dep.missionNodeId) ?? [];
      list.push(dep.dependsOnNodeId);
      dependencyMap.set(dep.missionNodeId, list);
    }

    await requestJson(`/api/missions/${missionId}/hierarchy`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        missionId,
        nodes: graphNodes.map((node: any, index: number) => ({
          id: String(node.id),
          refType: node.refType,
          refId: String(node.refId),
          parentNodeId: node.parentNodeId ?? null,
          sortOrder: Number(node.sortOrder ?? index + 1),
          dependencyIds: Array.isArray(node.dependencyIds) ? node.dependencyIds.map(String) : dependencyMap.get(String(node.id)) ?? []
        }))
      })
    });
  }

  const plan = await requestJson<{ id: string }>("/api/plans", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sourceType,
      sourceId: resolvedTargetId,
      title,
      cadence,
      scheduleEnd,
      lineageNodeId: payload?.lineageNodeId || undefined,
      actorType: payload?.actorType || undefined,
      milestones: scheduleEnd ? [{ title: "Target milestone", dueAt: scheduleEnd, status: "OPEN" }] : [],
      criteria,
      thresholds,
      preparation,
      extras,
      riskRegisterIds
    })
  });

  await requestJson("/api/tasks", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sourceType: "PLAN",
      sourceId: plan.id,
      title,
      horizon: "WEEK",
      dueDate: scheduleEnd,
      status: "NOT_STARTED",
      effortEstimate: Number(payload?.priority ?? 50)
    })
  });
}

