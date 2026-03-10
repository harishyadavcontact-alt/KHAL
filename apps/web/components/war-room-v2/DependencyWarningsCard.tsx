import React from "react";
import { WarGameModeEvaluation } from "./types";

function modeLabel(mode: string) {
  if (mode === "source") return "State of the Art";
  if (mode === "affair") return "Affairs";
  if (mode === "interest") return "Interests";
  if (mode === "lineage") return "Lineage";
  if (mode === "mission") return "Mission";
  if (mode === "craft") return "Craft";
  return "Domain";
}

function fieldLabel(field: string) {
  const labels: Record<string, string> = {
    source_profile: "choose a source of volatility",
    semantic_domains: "link semantic domains",
    decision_type: "classify decision structure",
    tail_class: "classify tail behavior",
    quadrant: "derive the fourth-quadrant position",
    means_posture: "confirm admissible means posture",
    stakes: "write stakes",
    risks: "write risks",
    fragility_profile: "define fragility and vulnerabilities",
    ends: "define hedge and edge",
    means: "choose craft, heuristics, and avoid list",
    domain_class: "define domain posture",
    risk_map: "map risk propagation",
    ends_means_posture: "set ends and means posture",
    objective: "set objective",
    orks_kpis: "set ORKs/KPIs",
    preparation: "prepare means",
    thresholds: "set thresholds",
    execution_chain: "build execution chain",
    forge_wield_tinker: "set lab stage",
    hypothesis: "state hypothesis",
    loss_expiry: "declare max-loss and expiry",
    kill_criteria: "set kill criteria",
    barbell_split: "set barbell split",
    evidence: "attach evidence",
    exposure_map: "map exposure",
    stake_scaling: "scale stakes",
    blast_radius: "map blast radius",
    intergenerational_risk: "map intergenerational risk",
    hierarchy: "define mission hierarchy",
    dependency_chain: "define dependencies",
    readiness: "confirm readiness"
  };
  return labels[field] ?? field.replaceAll("_", " ");
}

export function DependencyWarningsCard({ evaluation }: { evaluation: WarGameModeEvaluation }) {
  return (
    <div className="rounded-xl border border-white/10 bg-zinc-900/40 p-3 mb-4">
      <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-2">Doctrine Warnings</div>
      {!evaluation.dependency.missingModes.length && !evaluation.missingRequiredFields.length ? (
        <div className="text-xs text-emerald-300">No sequence or doctrine gaps in the current step.</div>
      ) : (
        <div className="space-y-2 text-xs">
          {evaluation.dependency.missingModes.length ? (
            <div className="text-amber-300">
              Complete earlier sections first: {evaluation.dependency.missingModes.map((mode) => modeLabel(mode)).join(", ")}
            </div>
          ) : null}
          {evaluation.missingRequiredFields.length ? (
            <div className="text-red-300">
              Still missing: {evaluation.missingRequiredFields.map((field) => fieldLabel(field)).join(", ")}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
