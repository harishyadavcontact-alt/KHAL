import type { AppData, IntentMirrorLevel, IntentMirrorSnapshot, LineageNodeDto, MayaFlowSnapshot } from "../../components/war-room-v2/types";
import { buildMayaFlowSnapshot } from "./maya-metrics";
import { computeBarbellGuardrail } from "./operational-metrics";

const OPEN_RISK_STATUSES = new Set(["open", "mitigating", "incomplete"]);

const LADDER_ORDER: Array<{ levelKey: IntentMirrorLevel["levelKey"]; label: string }> = [
  { levelKey: "SELF", label: "Self" },
  { levelKey: "FAMILY", label: "Family" },
  { levelKey: "FRIENDS", label: "Friends" },
  { levelKey: "COMMUNITY", label: "Community" },
  { levelKey: "STATE", label: "State" },
  { levelKey: "NATION", label: "Nation" },
  { levelKey: "HUMANITY", label: "Humanity" },
  { levelKey: "NATURE", label: "Nature" }
];

function normalize(value?: string): string {
  return (value ?? "").trim().toLowerCase();
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

function isOpenRisk(status?: string): boolean {
  if (!status) return true;
  return OPEN_RISK_STATUSES.has(normalize(status));
}

function bandForScore(score: number): IntentMirrorLevel["band"] {
  if (score >= 75) return "critical";
  if (score >= 45) return "watch";
  return "stable";
}

function mapNodeToLadderLevel(node: LineageNodeDto): IntentMirrorLevel["levelKey"] | null {
  const level = normalize(node.level);
  const name = normalize(node.name);
  const token = `${level} ${name}`;

  if (token.includes("self") || token.includes("individual")) return "SELF";
  if (token.includes("family")) return "FAMILY";
  if (token.includes("friend")) return "FRIENDS";
  if (token.includes("community") || token.includes("tribe")) return "COMMUNITY";
  if (token.includes("state")) return "STATE";
  if (token.includes("nation") || token.includes("country")) return "NATION";
  if (token.includes("humanity") || token.includes("civilization")) return "HUMANITY";
  if (token.includes("nature") || token.includes("ecosystem")) return "NATURE";
  return null;
}

function buildPrincipalLadder(data: AppData): IntentMirrorLevel[] {
  const nodesByLevel = new Map<IntentMirrorLevel["levelKey"], string[]>();
  for (const row of LADDER_ORDER) nodesByLevel.set(row.levelKey, []);

  for (const node of data.lineages?.nodes ?? []) {
    const levelKey = mapNodeToLadderLevel(node);
    if (!levelKey) continue;
    const ids = nodesByLevel.get(levelKey) ?? [];
    ids.push(node.id);
    nodesByLevel.set(levelKey, ids);
  }

  const openRisks = (data.lineageRisks ?? []).filter((risk) => isOpenRisk(risk.status));

  return LADDER_ORDER.map((row) => {
    const nodeIds = nodesByLevel.get(row.levelKey) ?? [];
    if (!nodeIds.length) {
      return {
        levelKey: row.levelKey,
        label: row.label,
        nodeIds: [],
        score: null,
        band: "unmapped"
      };
    }
    const scores = openRisks
      .filter((risk) => nodeIds.includes(risk.lineageNodeId))
      .map((risk) => clamp(asNumber(risk.fragilityScore, 0), 0, 100));
    const score = scores.length ? round(scores.reduce((sum, value) => sum + value, 0) / scores.length) : 0;
    return {
      levelKey: row.levelKey,
      label: row.label,
      nodeIds,
      score,
      band: bandForScore(score)
    };
  });
}

export function buildIntentMirrorSnapshot(data: AppData, mayaSnapshot?: MayaFlowSnapshot): IntentMirrorSnapshot {
  const resolvedMaya = mayaSnapshot ?? buildMayaFlowSnapshot(data);
  const ladder = buildPrincipalLadder(data);
  const guardrail = computeBarbellGuardrail(data);
  const openRiskScores = (data.lineageRisks ?? [])
    .filter((risk) => isOpenRisk(risk.status))
    .map((risk) => clamp(asNumber(risk.fragilityScore, 0), 0, 100));

  const hasCriticalOpenRisk = openRiskScores.some((score) => score >= 85);
  const caveDominanceGap = resolvedMaya.caveSharePct - resolvedMaya.convexSharePct;
  const noRuinState: IntentMirrorSnapshot["noRuinState"] =
    hasCriticalOpenRisk || (guardrail.fragileMiddle && caveDominanceGap >= 20) ? "AT_RISK" : "CONTROLLED";

  const hasCriticalBand = ladder.some((level) => level.band === "critical");
  const directive = hasCriticalBand
    ? "Contain critical lineage fragility first."
    : guardrail.fragileMiddle
      ? "Polarize barbell: reduce fragile middle."
      : resolvedMaya.caveSharePct > resolvedMaya.convexSharePct
        ? "Reduce short-vol exposure in top source."
        : "Scale convex options with capped downside.";

  return {
    condition: "Causal Opacity: Active",
    signal: "Harm",
    principalLadder: ladder,
    noRuinState,
    barbellState: guardrail.status,
    directive,
    convexSharePct: resolvedMaya.convexSharePct,
    caveSharePct: resolvedMaya.caveSharePct
  };
}
