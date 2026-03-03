import type { AppData, MayaFlowSnapshot, MayaSourceSignal, VolatilitySourceDto } from "../../components/war-room-v2/types";

const RESOLVED_STATUSES = new Set(["done", "completed", "resolved", "closed", "archived"]);
const OPEN_RISK_STATUSES = new Set(["open", "mitigating", "incomplete"]);

function normalizeToken(value: string | undefined): string {
  return (value ?? "").trim().toLowerCase();
}

function hasText(value: string | undefined): boolean {
  return Boolean(value && value.trim().length > 0);
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function round(value: number): number {
  return Math.round(value);
}

function asNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value.trim());
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function average(values: number[]): number {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function isActiveStatus(status?: string): boolean {
  if (!status) return true;
  return !RESOLVED_STATUSES.has(normalizeToken(status));
}

function isOpenRisk(status?: string): boolean {
  if (!status) return true;
  return OPEN_RISK_STATUSES.has(normalizeToken(status));
}

function resolveSourceDomainIds(source: VolatilitySourceDto, data: AppData): string[] {
  const domainIdSet = new Set<string>();

  for (const link of source.domains ?? []) {
    if (link?.domainId) domainIdSet.add(link.domainId);
  }

  if (!domainIdSet.size) {
    for (const domain of data.domains) {
      if (domain.volatilitySourceId === source.id) domainIdSet.add(domain.id);
    }
  }

  if (!domainIdSet.size) {
    const normalizedSourceName = normalizeToken(source.name);
    for (const domain of data.domains) {
      const candidates = [domain.volatilitySourceName, domain.volatilitySource, domain.volatility];
      const matched = candidates.some((candidate) => normalizeToken(candidate) === normalizedSourceName);
      if (matched) domainIdSet.add(domain.id);
    }
  }

  return Array.from(domainIdSet).sort((left, right) => left.localeCompare(right));
}

function taskDisorderPressure(tasks: AppData["tasks"]): number {
  if (!tasks.length) return 0;

  const now = Date.now();
  const nearTermBoundary = now + 7 * 24 * 60 * 60 * 1000;
  let overdue = 0;
  let nearTerm = 0;
  let unscheduled = 0;

  for (const task of tasks) {
    if (!hasText(task.dueDate)) {
      unscheduled += 1;
      continue;
    }
    const ts = Date.parse(task.dueDate as string);
    if (!Number.isFinite(ts)) {
      unscheduled += 1;
      continue;
    }
    if (ts < now) overdue += 1;
    else if (ts <= nearTermBoundary) nearTerm += 1;
  }

  const weighted = overdue * 20 + nearTerm * 10 + unscheduled * 6;
  return clamp(round(weighted / Math.max(1, tasks.length)), 0, 100);
}

function sourceSignal(source: VolatilitySourceDto, data: AppData): MayaSourceSignal {
  const domainIds = resolveSourceDomainIds(source, data);
  const domainIdSet = new Set(domainIds);

  const openSourceRisks = (data.lineageRisks ?? []).filter((risk) => {
    if (!isOpenRisk(risk.status)) return false;
    if (risk.sourceId === source.id) return true;
    return domainIdSet.has(risk.domainId);
  });

  const activeAffairs = data.affairs.filter((affair) => {
    if (!isActiveStatus(affair.status)) return false;
    return domainIdSet.has(affair.domainId);
  });

  const activeTasks = data.tasks.filter((task) => {
    if (!isActiveStatus(task.status)) return false;
    return domainIdSet.has(task.domainId);
  });

  const activeInterests = data.interests.filter((interest) => {
    if (!isActiveStatus(interest.status)) return false;
    return domainIdSet.has(interest.domainId);
  });

  const harmSignalFromRisks = average(openSourceRisks.map((risk) => clamp(asNumber(risk.fragilityScore, 0), 0, 100)));
  const harmSignalFromAffairs = average(
    activeAffairs.map((affair) => {
      const stakes = clamp(asNumber(affair.stakes, 5), 0, 10);
      const risk = clamp(asNumber(affair.risk, 5), 0, 10);
      return stakes * risk;
    })
  );
  const harmSignal = clamp(round(harmSignalFromRisks > 0 ? harmSignalFromRisks : harmSignalFromAffairs), 0, 100);

  const disorderPressure = taskDisorderPressure(activeTasks);

  const caveScore = clamp(round(0.65 * harmSignal + 0.35 * disorderPressure), 0, 100);

  const convexPotentialRaw = average(
    activeInterests.map((interest) => {
      const convexity = clamp(asNumber(interest.convexity, 5), 0, 10);
      const stakes = clamp(asNumber(interest.stakes, 5), 0, 10);
      return convexity * stakes;
    })
  );
  const convexPotential = clamp(round(convexPotentialRaw), 0, 100);

  const convexScore = clamp(round(0.7 * convexPotential + 0.3 * (100 - harmSignal)), 0, 100);
  const inputVolatility = clamp(round((harmSignal + disorderPressure) / 2), 0, 100);
  const lane = convexScore >= caveScore ? "CONVEX" : "CAVE";
  const conviction = Math.abs(convexScore - caveScore);

  return {
    sourceId: source.id,
    sourceName: source.name,
    sourceCode: source.code,
    domainIds,
    mappedDomainCount: domainIds.length,
    harmSignal,
    disorderPressure,
    caveScore,
    convexPotential,
    convexScore,
    inputVolatility,
    lane,
    conviction
  };
}

function sourceComparator(left: VolatilitySourceDto, right: VolatilitySourceDto): number {
  if (left.sortOrder !== right.sortOrder) return left.sortOrder - right.sortOrder;
  const nameCompare = left.name.localeCompare(right.name);
  if (nameCompare !== 0) return nameCompare;
  return left.id.localeCompare(right.id);
}

function weightedShares(sources: MayaSourceSignal[]): { convexSharePct: number; caveSharePct: number } {
  const totalWeight = sources.reduce((sum, source) => sum + source.inputVolatility, 0);
  if (totalWeight <= 0) {
    if (!sources.length) return { convexSharePct: 0, caveSharePct: 0 };
    return { convexSharePct: 50, caveSharePct: 50 };
  }

  const convexWeight = sources.reduce((sum, source) => sum + (source.lane === "CONVEX" ? source.inputVolatility : 0), 0);
  const convexSharePct = clamp(round((convexWeight / totalWeight) * 100), 0, 100);
  return {
    convexSharePct,
    caveSharePct: 100 - convexSharePct
  };
}

function heuristicCoverage(sources: MayaSourceSignal[], data: AppData): number {
  const mappedDomainIds = new Set<string>();
  for (const source of sources) {
    for (const domainId of source.domainIds) mappedDomainIds.add(domainId);
  }
  if (!mappedDomainIds.size) return 0;

  const domainById = new Map(data.domains.map((domain) => [domain.id, domain]));
  let withHeuristics = 0;
  for (const domainId of mappedDomainIds) {
    if (hasText(domainById.get(domainId)?.heuristics)) withHeuristics += 1;
  }
  return clamp(round((withHeuristics / mappedDomainIds.size) * 100), 0, 100);
}

function fallbackSources(data: AppData): VolatilitySourceDto[] {
  const byKey = new Map<string, VolatilitySourceDto>();

  for (const domain of data.domains) {
    const sourceId = domain.volatilitySourceId ?? `derived-${normalizeToken(domain.volatilitySourceName ?? domain.volatilitySource ?? domain.name)}`;
    const sourceName = domain.volatilitySourceName ?? domain.volatilitySource ?? "Unmapped Source";
    if (!byKey.has(sourceId)) {
      byKey.set(sourceId, {
        id: sourceId,
        code: sourceId.toUpperCase(),
        name: sourceName,
        sortOrder: Number.MAX_SAFE_INTEGER,
        domainCount: 0,
        domains: []
      });
    }
    const source = byKey.get(sourceId)!;
    source.domains = [...(source.domains ?? []), { id: `${sourceId}-${domain.id}`, sourceId, domainId: domain.id, dependencyKind: "PRIMARY", pathWeight: 1 }];
    source.domainCount += 1;
  }

  return Array.from(byKey.values()).sort(sourceComparator);
}

export function buildMayaFlowSnapshot(data: AppData): MayaFlowSnapshot {
  const providedSources = data.sources ?? [];
  const sourceList = (providedSources.length ? providedSources : fallbackSources(data)).slice().sort(sourceComparator);
  const signals = sourceList.map((source) => sourceSignal(source, data));
  const shares = weightedShares(signals);
  return {
    sources: signals,
    convexSharePct: shares.convexSharePct,
    caveSharePct: shares.caveSharePct,
    heuristicMeansCoveragePct: heuristicCoverage(signals, data)
  };
}
