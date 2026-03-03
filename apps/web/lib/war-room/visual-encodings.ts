import type {
  AppData,
  BalanceSegment,
  DomainVisualSnapshot,
  FlowLane,
  FlowLink,
  FlowNode,
  HeatCell,
  HeatColumn,
  HeatRow,
  MissionTierVisual,
  MissionVisualSnapshot,
  RiskBand,
  WarGamingVisualSnapshot
} from "../../components/war-room-v2/types";
import { buildMayaFlowSnapshot } from "./maya-metrics";

const OPEN_RISK_STATUSES = new Set(["open", "mitigating", "incomplete"]);
const RESOLVED_STATUSES = new Set(["done", "completed", "resolved", "closed", "archived"]);

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

function extractNumber(text: string | undefined, fallback: number): number {
  if (!text) return fallback;
  const match = text.match(/-?\d+(\.\d+)?/);
  if (!match) return fallback;
  return asNumber(match[0], fallback);
}

function isOpenRiskStatus(status?: string): boolean {
  if (!status) return true;
  return OPEN_RISK_STATUSES.has(status.trim().toLowerCase());
}

function isActiveStatus(status?: string): boolean {
  if (!status) return true;
  return !RESOLVED_STATUSES.has(status.trim().toLowerCase());
}

function toBand(value: number): RiskBand {
  if (value >= 85) return "critical";
  if (value >= 60) return "watch";
  return "stable";
}

function tensionBand(value: number): RiskBand {
  if (value >= 75) return "critical";
  if (value >= 40) return "watch";
  return "stable";
}

function flowWeight(fragility: number, serialLoad: number, parallelLoad: number): number {
  return clamp(round(0.6 * fragility + 0.4 * Math.max(serialLoad, parallelLoad)), 0, 100);
}

function responseUrgencyScore(responseTime: number): number {
  return clamp(round(((14 - Math.min(responseTime, 14)) / 14) * 100), 0, 100);
}

function weightedCountHeat(count: number, total: number): number {
  if (!total) return 0;
  return clamp(round((count / total) * 100), 0, 100);
}

function laneTone(status: string): FlowLink["lane"] {
  if (status === "CONVEX") return "CONVEX";
  if (status === "CAVE") return "CAVE";
  return "CAVE";
}

export function buildMissionVisualSnapshot(data: AppData): MissionVisualSnapshot {
  const openRisks = (data.lineageRisks ?? [])
    .filter((risk) => isOpenRiskStatus(risk.status))
    .sort((a, b) => asNumber(b.fragilityScore, 0) - asNumber(a.fragilityScore, 0))
    .slice(0, 12);

  const activeAffairs = data.affairs.filter((affair) => isActiveStatus(affair.status));
  const activeInterests = data.interests.filter((interest) => isActiveStatus(interest.status));

  const rows: MissionTierVisual[] = openRisks.map((risk, index) => {
    const linkedAffairs = activeAffairs.filter((affair) => affair.domainId === risk.domainId || affair.context?.associatedDomains?.includes(risk.domainId));
    const linkedInterests = activeInterests.filter((interest) => interest.domainId === risk.domainId);
    const serialLoad = clamp(linkedAffairs.length * 20, 0, 100);
    const parallelLoad = clamp(linkedInterests.length * 20, 0, 100);
    const fragility = clamp(round(asNumber(risk.fragilityScore, 0)), 0, 100);
    return {
      id: `tier-${risk.id}`,
      riskId: risk.id,
      domainId: risk.domainId,
      tier: index + 1,
      title: risk.title,
      fragility,
      serialLoad,
      parallelLoad,
      conviction: Math.abs(serialLoad - parallelLoad),
      flowWeight: flowWeight(fragility, serialLoad, parallelLoad),
      stream: serialLoad >= parallelLoad ? "hedge" : "edge",
      serialAffairs: linkedAffairs.slice(0, 3).map((affair) => affair.title),
      parallelInterests: linkedInterests.slice(0, 3).map((interest) => interest.title)
    };
  });

  const heatColumns: HeatColumn[] = [
    { id: "fragility", label: "Fragility" },
    { id: "serialLoad", label: "Serial" },
    { id: "parallelLoad", label: "Parallel" },
    { id: "conviction", label: "Conviction" }
  ];

  const heatRows: HeatRow[] = rows.map((row) => ({
    id: row.id,
    label: `T${row.tier}`,
    meta: row.title
  }));

  const heatCells: HeatCell[] = rows.flatMap((row) => [
    {
      rowId: row.id,
      columnId: "fragility",
      value: row.fragility,
      band: toBand(row.fragility),
      hint: row.title
    },
    {
      rowId: row.id,
      columnId: "serialLoad",
      value: row.serialLoad,
      band: tensionBand(row.serialLoad),
      hint: row.serialAffairs.join(", ")
    },
    {
      rowId: row.id,
      columnId: "parallelLoad",
      value: row.parallelLoad,
      band: tensionBand(row.parallelLoad),
      hint: row.parallelInterests.join(", ")
    },
    {
      rowId: row.id,
      columnId: "conviction",
      value: row.conviction,
      band: tensionBand(row.conviction),
      hint: row.stream === "hedge" ? "serial-dominant" : "parallel-dominant"
    }
  ]);

  const flowNodes: FlowNode[] = rows.map((row) => ({
    id: row.id,
    label: `T${row.tier} ${row.title}`,
    value: row.flowWeight,
    meta: `F${row.fragility}`
  }));
  const flowLanes: FlowLane[] = [
    { id: "SERIAL", label: "Serial" },
    { id: "PARALLEL", label: "Parallel" }
  ];
  const flowLinks: FlowLink[] = rows.flatMap((row) => {
    const links: FlowLink[] = [];
    if (row.serialLoad > 0) {
      links.push({
        id: `${row.id}-serial`,
        sourceId: row.id,
        laneId: "SERIAL",
        weight: row.serialLoad,
        lane: "SERIAL",
        label: `${row.serialLoad}`
      });
    }
    if (row.parallelLoad > 0) {
      links.push({
        id: `${row.id}-parallel`,
        sourceId: row.id,
        laneId: "PARALLEL",
        weight: row.parallelLoad,
        lane: "PARALLEL",
        label: `${row.parallelLoad}`
      });
    }
    if (!links.length) {
      links.push({
        id: `${row.id}-idle`,
        sourceId: row.id,
        laneId: "SERIAL",
        weight: 10,
        lane: "SERIAL",
        label: "idle"
      });
    }
    return links;
  });

  const hedgeCount = activeAffairs.length;
  const edgeCount = activeInterests.length;
  const total = Math.max(1, hedgeCount + edgeCount);
  const balanceSegments: BalanceSegment[] = [
    {
      id: "hedge",
      label: `Hedge ${round((hedgeCount / total) * 100)}%`,
      value: hedgeCount,
      tone: "hedge"
    },
    {
      id: "edge",
      label: `Edge ${round((edgeCount / total) * 100)}%`,
      value: edgeCount,
      tone: "edge"
    }
  ];

  return {
    rows,
    heatColumns,
    heatRows,
    heatCells,
    flowNodes,
    flowLanes,
    flowLinks,
    balanceSegments
  };
}

export function buildWarGamingVisualSnapshot(input: Pick<AppData, "sources" | "domains" | "affairs" | "interests" | "tasks" | "lineageRisks">): WarGamingVisualSnapshot {
  const openRisks = (input.lineageRisks ?? []).filter((risk) => isOpenRiskStatus(risk.status));

  let lowRandomLowImpact = 0;
  let lowRandomHighImpact = 0;
  let highRandomLowImpact = 0;
  let highRandomHighImpact = 0;

  for (const risk of openRisks) {
    const impactScore = clamp(round(asNumber(risk.fragilityScore, 0)), 0, 100);
    const randomnessScore = clamp(
      round(((asNumber(risk.exposure, 5) + asNumber(risk.dependency, 5) + (11 - asNumber(risk.optionality, 5))) / 3) * 10),
      0,
      100
    );
    const isHighRandom = randomnessScore >= 50;
    const isHighImpact = impactScore >= 60;
    if (isHighRandom && isHighImpact) highRandomHighImpact += 1;
    else if (isHighRandom) highRandomLowImpact += 1;
    else if (isHighImpact) lowRandomHighImpact += 1;
    else lowRandomLowImpact += 1;
  }

  const quadrantRows: HeatRow[] = [
    { id: "low-random", label: "Low Randomness" },
    { id: "high-random", label: "High Randomness" }
  ];
  const quadrantColumns: HeatColumn[] = [
    { id: "low-impact", label: "Low Impact" },
    { id: "high-impact", label: "High Impact" }
  ];

  const totalOpen = openRisks.length;
  const quadrantCells: HeatCell[] = [
    {
      rowId: "low-random",
      columnId: "low-impact",
      value: weightedCountHeat(lowRandomLowImpact, totalOpen),
      band: tensionBand(weightedCountHeat(lowRandomLowImpact, totalOpen)),
      hint: `${lowRandomLowImpact} risks`
    },
    {
      rowId: "low-random",
      columnId: "high-impact",
      value: weightedCountHeat(lowRandomHighImpact, totalOpen),
      band: toBand(weightedCountHeat(lowRandomHighImpact, totalOpen)),
      hint: `${lowRandomHighImpact} risks`
    },
    {
      rowId: "high-random",
      columnId: "low-impact",
      value: weightedCountHeat(highRandomLowImpact, totalOpen),
      band: tensionBand(weightedCountHeat(highRandomLowImpact, totalOpen)),
      hint: `${highRandomLowImpact} risks`
    },
    {
      rowId: "high-random",
      columnId: "high-impact",
      value: weightedCountHeat(highRandomHighImpact, totalOpen),
      band: toBand(weightedCountHeat(highRandomHighImpact, totalOpen)),
      hint: `${highRandomHighImpact} risks`
    }
  ];

  const maya = buildMayaFlowSnapshot({
    user: { birthDate: "2000-01-01T00:00:00.000Z", lifeExpectancy: 80 },
    strategyMatrix: { allies: 0, enemies: 0, overt: 0, covert: 0, offense: 0, defense: 0, conventional: 0, unconventional: 0 },
    laws: [],
    crafts: [],
    missionGraph: { nodes: [], dependencies: [] },
    lineages: { nodes: [], entities: [] },
    doctrine: { rulebooks: [], rules: [], domainPnLLadders: [] },
    sources: input.sources ?? [],
    domains: input.domains,
    affairs: input.affairs,
    interests: input.interests,
    tasks: input.tasks,
    lineageRisks: input.lineageRisks ?? []
  });

  const sourceNodes: FlowNode[] = maya.sources.map((source) => ({
    id: source.sourceId,
    label: source.sourceName,
    value: source.inputVolatility,
    meta: `V${source.inputVolatility}`
  }));
  const sourceLanes: FlowLane[] = [
    { id: "CAVE", label: "CAVE" },
    { id: "CONVEX", label: "CONVEX" }
  ];
  const sourceLinks: FlowLink[] = maya.sources.map((source) => ({
    id: `source-flow-${source.sourceId}`,
    sourceId: source.sourceId,
    laneId: source.lane,
    weight: source.inputVolatility,
    lane: laneTone(source.lane),
    label: `${source.conviction}`
  }));

  const penaltySegments: BalanceSegment[] = [
    { id: "order", label: "Order", value: totalOpen > 0 ? 12 : 0, tone: "watch" },
    { id: "orks", label: "ORK", value: totalOpen > 3 ? 12 : 6, tone: "risk" },
    { id: "kpis", label: "KPI", value: totalOpen > 4 ? 12 : 6, tone: "risk" },
    { id: "threshold", label: "Threshold", value: totalOpen > 0 ? 10 : 4, tone: "watch" },
    { id: "prep", label: "Prep", value: totalOpen > 1 ? 10 : 4, tone: "watch" }
  ];

  return {
    quadrantColumns,
    quadrantRows,
    quadrantCells,
    sourceNodes,
    sourceLanes,
    sourceLinks,
    penaltySegments
  };
}

export function buildDomainVisualSnapshot(input: { domainId: string; data: AppData }): DomainVisualSnapshot {
  const domain = input.data.domains.find((item) => item.id === input.domainId);
  const domainAffairs = input.data.affairs.filter((affair) => affair.domainId === input.domainId && isActiveStatus(affair.status));
  const domainInterests = input.data.interests.filter((interest) => interest.domainId === input.domainId && isActiveStatus(interest.status));
  const domainRisks = (input.data.lineageRisks ?? []).filter((risk) => risk.domainId === input.domainId);

  const stakesFallback = domainAffairs.length
    ? round((domainAffairs.reduce((sum, affair) => sum + asNumber(affair.stakes, 5), 0) / domainAffairs.length) * 10)
    : 50;
  const riskFallback = domainAffairs.length
    ? round((domainAffairs.reduce((sum, affair) => sum + asNumber(affair.risk, 5), 0) / domainAffairs.length) * 10)
    : 50;
  const fragilityFallback = domainRisks.length
    ? round(domainRisks.reduce((sum, risk) => sum + clamp(asNumber(risk.fragilityScore, 0), 0, 100), 0) / domainRisks.length)
    : 50;

  const stakes = clamp(round(extractNumber(domain?.stakesText, stakesFallback)), 0, 100);
  const risk = clamp(round(extractNumber(domain?.risksText, riskFallback)), 0, 100);
  const fragility = clamp(round(extractNumber(domain?.fragilityText, fragilityFallback)), 0, 100);

  const posture: DomainVisualSnapshot["posture"] = [
    { id: "stakes", label: "Stakes", value: stakes },
    { id: "risk", label: "Risk", value: risk },
    { id: "fragility", label: "Fragility", value: fragility }
  ];

  const hedgeMass = domainAffairs.reduce((sum, affair) => sum + asNumber(affair.stakes, 5) * asNumber(affair.risk, 5), 0);
  const edgeMass = domainInterests.reduce((sum, interest) => sum + asNumber(interest.convexity, 5) * asNumber(interest.stakes, 5), 0);

  const barbellSegments: BalanceSegment[] = [
    { id: "hedge", label: "Hedge", value: round(hedgeMass), tone: "hedge" },
    { id: "edge", label: "Edge", value: round(edgeMass), tone: "edge" }
  ];

  const heuristicsScore = domain?.heuristics?.trim() ? 50 : 0;
  const tacticsScore = domain?.tactics?.trim() ? 25 : 0;
  const meansAffairScore = domainAffairs.some((affair) => affair.means?.craftId?.trim()) ? 25 : 0;
  const meansCoveragePct = clamp(heuristicsScore + tacticsScore + meansAffairScore, 0, 100);

  const riskColumns: HeatColumn[] = [
    { id: "exposure", label: "E" },
    { id: "dependency", label: "D" },
    { id: "irreversibility", label: "I" },
    { id: "optionality", label: "O" },
    { id: "urgency", label: "Urgency" },
    { id: "fragility", label: "Fragility" }
  ];
  const riskRows: HeatRow[] = domainRisks.map((risk) => ({
    id: risk.id,
    label: risk.title,
    meta: risk.status
  }));
  const riskCells: HeatCell[] = domainRisks.flatMap((risk) => {
    const exposure = clamp(round(asNumber(risk.exposure, 0) * 10), 0, 100);
    const dependency = clamp(round(asNumber(risk.dependency, 0) * 10), 0, 100);
    const irreversibility = clamp(round(asNumber(risk.irreversibility, 0) * 10), 0, 100);
    const optionality = clamp(round((11 - asNumber(risk.optionality, 0)) * 10), 0, 100);
    const urgency = responseUrgencyScore(asNumber(risk.responseTime, 7));
    const fragilityValue = clamp(round(asNumber(risk.fragilityScore, 0)), 0, 100);
    return [
      { rowId: risk.id, columnId: "exposure", value: exposure, band: toBand(exposure), hint: `${risk.exposure}` },
      { rowId: risk.id, columnId: "dependency", value: dependency, band: toBand(dependency), hint: `${risk.dependency}` },
      { rowId: risk.id, columnId: "irreversibility", value: irreversibility, band: toBand(irreversibility), hint: `${risk.irreversibility}` },
      { rowId: risk.id, columnId: "optionality", value: optionality, band: toBand(optionality), hint: `${risk.optionality}` },
      { rowId: risk.id, columnId: "urgency", value: urgency, band: toBand(urgency), hint: `${risk.responseTime}d` },
      { rowId: risk.id, columnId: "fragility", value: fragilityValue, band: toBand(fragilityValue), hint: `${risk.fragilityScore}` }
    ];
  });

  const riskTrend = domainRisks
    .map((risk) => clamp(round(asNumber(risk.fragilityScore, 0)), 0, 100))
    .sort((left, right) => left - right);

  return {
    posture,
    barbellSegments,
    meansCoveragePct,
    riskRows,
    riskColumns,
    riskCells,
    riskTrend
  };
}
