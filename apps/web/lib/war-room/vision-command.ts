import type { AppData } from "../../components/war-room-v2/types";
import { confidenceToSignalBand } from "./signal-language";
import { unresolvedDoctrineGapByDomain } from "../doctrine/gaps";

export interface VisionCommandSnapshot {
  signalBand: "STRONG" | "WATCH" | "WEAK";
  unresolvedAffairs: number;
  doctrineGapDomainCount: number;
  recommendations: string[];
}

export function buildVisionCommandSnapshot(data: AppData): VisionCommandSnapshot {
  const signalBand = data.signalBand ?? confidenceToSignalBand(data.confidence);
  const unresolvedAffairs = data.affairs.filter(
    (affair) => !(affair.domainId && affair.means?.craftId && (affair.plan?.objectives?.length ?? 0) > 0)
  ).length;
  const doctrineGapDomainCount = unresolvedDoctrineGapByDomain(data.sources ?? [], data.responseLogic ?? []).size;

  const recommendations: string[] = [];
  if (doctrineGapDomainCount > 0) {
    recommendations.push(`Resolve doctrine gaps across ${doctrineGapDomainCount} domain(s) before increasing mission tempo.`);
  }
  if (unresolvedAffairs > 0) {
    recommendations.push(`Complete planning fields for ${unresolvedAffairs} unresolved affair(s) to tighten execution readiness.`);
  }
  if ((data.interests?.length ?? 0) === 0) {
    recommendations.push("Seed at least one interest to establish a convex optionality lane.");
  }
  if (!recommendations.length) {
    recommendations.push("Maintain doctrine hygiene and proceed with mission hierarchy pressure-tests.");
  }

  return {
    signalBand,
    unresolvedAffairs,
    doctrineGapDomainCount,
    recommendations
  };
}
