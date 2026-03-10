import type { SourceMapDecisionType, SourceMapQuadrant, SourceMapTailClass } from "../../components/war-room-v2/types";

export function deriveQuadrant(decisionType: SourceMapDecisionType, tailClass: SourceMapTailClass): SourceMapQuadrant {
  if (decisionType === "simple" && tailClass === "thin") return "Q1";
  if (decisionType === "simple") return "Q2";
  if (tailClass === "thin") return "Q3";
  return "Q4";
}

export function methodPostureForQuadrant(quadrant: SourceMapQuadrant): string {
  if (quadrant === "Q1") {
    return "Use structured analysis, base rates, and explicit measurement. Statistical tools are admissible.";
  }
  if (quadrant === "Q2") {
    return "Keep downside explicit. Use heuristics, bounded modeling, and capped exposure instead of naive extrapolation.";
  }
  if (quadrant === "Q3") {
    return "Prefer heuristics and local judgment over abstract optimization. Watch for hidden fragility in opaque structure.";
  }
  return "No-ruin first. Use barbell posture, heuristics, optionality, and limited intervention. Avoid overconfident prediction.";
}

export function decisionTypeLabel(value: SourceMapDecisionType): string {
  return value === "simple" ? "Clear structure" : "Opaque structure";
}

export function tailClassLabel(value: SourceMapTailClass): string {
  if (value === "thin") return "Stable variation";
  if (value === "fat") return "Explosive variation";
  return "Unclear, treat cautiously";
}

export function quadrantNarrative(args: { decisionType: SourceMapDecisionType; tailClass: SourceMapTailClass; quadrant: SourceMapQuadrant }): string {
  const decision = decisionTypeLabel(args.decisionType).toLowerCase();
  const tail = tailClassLabel(args.tailClass).toLowerCase();
  return `${args.quadrant}: ${decision} inside ${tail}.`;
}
