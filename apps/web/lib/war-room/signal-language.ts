import type { ConfidenceEvidenceMeta } from "../../components/war-room-v2/types";

export type OperatorSignalBand = "STRONG" | "WATCH" | "WEAK";

export function confidenceToSignalBand(confidence?: ConfidenceEvidenceMeta): OperatorSignalBand {
  if (!confidence) return "WATCH";
  if (confidence.confidence === "HIGH") return "STRONG";
  if (confidence.confidence === "LOW") return "WEAK";
  return "WATCH";
}

export function signalBandTone(signal: OperatorSignalBand): "text-emerald-300" | "text-amber-300" | "text-red-300" {
  if (signal === "STRONG") return "text-emerald-300";
  if (signal === "WEAK") return "text-red-300";
  return "text-amber-300";
}
