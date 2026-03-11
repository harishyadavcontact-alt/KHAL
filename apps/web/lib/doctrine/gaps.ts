import type { SourceMapProfileDto, VolatilitySourceDto } from "../../components/war-room-v2/types";
import type { WarGameDoctrineChain } from "../war-room/bootstrap";

export type DoctrineGapCode = "doctrine_chain" | "scenario_logic" | "threat_logic" | "response_logic";

export function doctrineGapReason(code: DoctrineGapCode): string {
  if (code === "doctrine_chain") return "Selected craft has no doctrine chain (scenario -> threat -> response).";
  if (code === "scenario_logic") return "Doctrine chain is missing scenarios.";
  if (code === "threat_logic") return "Doctrine chain is missing threats.";
  return "Doctrine chain is missing responses.";
}

export function doctrineWarningsForProfile(profile: Pick<SourceMapProfileDto, "primaryCraftId">, responseLogic: WarGameDoctrineChain[]): string[] {
  const craftId = profile.primaryCraftId?.trim();
  if (!craftId) return ["No primary craft selected; doctrine chain is undefined."];
  const gap = doctrineGapForCraft(craftId, responseLogic);
  return gap ? [doctrineGapReason(gap)] : [];
}

export function doctrineGapForCraft(craftId: string, responseLogic: WarGameDoctrineChain[]): DoctrineGapCode | undefined {
  const chains = responseLogic.filter((chain) => chain.craftId === craftId);
  if (!chains.length) return "doctrine_chain";

  const hasScenarios = chains.some((chain) => chain.scenarios.length > 0);
  if (!hasScenarios) return "scenario_logic";

  const hasThreats = chains.some((chain) => chain.scenarios.some((scenario) => scenario.threats.length > 0));
  if (!hasThreats) return "threat_logic";

  const hasResponses = chains.some((chain) => chain.scenarios.some((scenario) => scenario.threats.some((threat) => threat.responses.length > 0)));
  if (!hasResponses) return "response_logic";

  return undefined;
}

export function missingDoctrineForSourceProfiles(profiles: SourceMapProfileDto[], responseLogic: WarGameDoctrineChain[]): DoctrineGapCode[] {
  if (!profiles.length) return [];
  const selectedCraftIds = Array.from(
    new Set(
      profiles
        .map((item) => item.primaryCraftId?.trim())
        .filter((item): item is string => Boolean(item))
    )
  ).sort();
  if (!selectedCraftIds.length) return [];

  for (const craftId of selectedCraftIds) {
    const gap = doctrineGapForCraft(craftId, responseLogic);
    if (gap) return [gap];
  }

  return [];
}

export function unresolvedDoctrineGapBySourceDomain(
  sources: VolatilitySourceDto[] = [],
  responseLogic: WarGameDoctrineChain[] = []
): Map<string, DoctrineGapCode> {
  const out = new Map<string, DoctrineGapCode>();
  for (const source of sources) {
    for (const profile of source.mapProfiles ?? []) {
      const craftId = profile.primaryCraftId?.trim();
      if (!craftId) continue;
      const gap = doctrineGapForCraft(craftId, responseLogic);
      if (gap) out.set(`${profile.sourceId}:${profile.domainId}`, gap);
    }
  }
  return out;
}
