import type { Affair, AppData, Domain, Interest, LineageRiskDto, VolatilitySourceDto } from "../components/war-room-v2/types";

export type CanonicalVolatilitySlotKey = "universe" | "nature" | "nurture" | "land" | "time" | "law6";

export const CANONICAL_VOLATILITY_SLOTS: Array<{ key: CanonicalVolatilitySlotKey; label: string }> = [
  { key: "universe", label: "Law of Universe" },
  { key: "nature", label: "Law of Nature" },
  { key: "nurture", label: "Law of Nurture" },
  { key: "land", label: "Law of Land" },
  { key: "time", label: "Law of Time" },
  { key: "law6", label: "Law 6 (TBD)" }
];

export const EXPECTED_WARGAME_MODES = ["source", "domain", "affair", "interest", "craft", "mission", "lineage"] as const;

const SLOT_ORDER: Record<CanonicalVolatilitySlotKey, number> = {
  universe: 0,
  nature: 1,
  nurture: 2,
  land: 3,
  time: 4,
  law6: 5
};

function normalizeToken(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function firstNonEmpty(values: Array<string | null | undefined>): string | null {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}

export function mapSourceLabelToSlot(label?: string | null): CanonicalVolatilitySlotKey | null {
  if (!label?.trim()) return null;
  const normalized = normalizeToken(label);
  if (normalized.includes("universe") || normalized.includes("physics")) return "universe";
  if (normalized.includes("nature")) return "nature";
  if (normalized.includes("nurture")) return "nurture";
  if (normalized.includes("land")) return "land";
  if (normalized.includes("time")) return "time";
  if (normalized.includes("jungle") || normalized.includes("law 6") || normalized.includes("law6") || normalized.includes("tbd") || normalized.includes("ecology")) {
    return "law6";
  }
  return null;
}

function sourceSortOrder(sourceId: string | undefined, sources: VolatilitySourceDto[] | undefined): number {
  if (!sourceId || !sources?.length) return Number.MAX_SAFE_INTEGER;
  const match = sources.find((source) => source.id === sourceId);
  return typeof match?.sortOrder === "number" ? match.sortOrder : Number.MAX_SAFE_INTEGER;
}

export function resolveDomainSourceLabel(
  domain: Domain,
  context: Pick<AppData, "sources" | "laws">
): string | null {
  const sourceById = context.sources?.find((source) => source.id === domain.volatilitySourceId);
  const lawById = context.laws.find((law) => law.id === domain.lawId);
  return firstNonEmpty([
    domain.volatilitySourceName,
    domain.volatilitySource,
    domain.volatility,
    sourceById?.name,
    lawById?.volatilitySource,
    lawById?.name
  ]);
}

export interface DomainSlotProjection {
  domainId: string;
  domainName: string;
  sourceLabel: string | null;
  slotKey: CanonicalVolatilitySlotKey | null;
  sortOrder: number;
}

export function projectDomainsToVolatilitySlots(data: Pick<AppData, "domains" | "sources" | "laws">): DomainSlotProjection[] {
  return data.domains.map((domain) => {
    const sourceLabel = resolveDomainSourceLabel(domain, data);
    return {
      domainId: domain.id,
      domainName: domain.name,
      sourceLabel,
      slotKey: mapSourceLabelToSlot(sourceLabel),
      sortOrder: sourceSortOrder(domain.volatilitySourceId, data.sources)
    };
  });
}

export interface HierarchyNode {
  id: string;
  layerDepth: number;
  slotKey: CanonicalVolatilitySlotKey;
  sortOrder?: number;
  lexicalKey?: string;
}

export function deterministicHierarchySort<T extends HierarchyNode>(nodes: T[]): T[] {
  return [...nodes].sort((left, right) => {
    if (left.layerDepth !== right.layerDepth) return left.layerDepth - right.layerDepth;
    const leftSlot = SLOT_ORDER[left.slotKey];
    const rightSlot = SLOT_ORDER[right.slotKey];
    if (leftSlot !== rightSlot) return leftSlot - rightSlot;
    const leftOrder = typeof left.sortOrder === "number" ? left.sortOrder : Number.MAX_SAFE_INTEGER;
    const rightOrder = typeof right.sortOrder === "number" ? right.sortOrder : Number.MAX_SAFE_INTEGER;
    if (leftOrder !== rightOrder) return leftOrder - rightOrder;
    const leftLexical = left.lexicalKey ?? left.id;
    const rightLexical = right.lexicalKey ?? right.id;
    return leftLexical.localeCompare(rightLexical);
  });
}

export function classifyAffairLane(_: Affair): "obligation" {
  return "obligation";
}

export function classifyInterestLane(_: Interest): "optionality" {
  return "optionality";
}

function hasNonEmptyNarrativeField(value: string | undefined): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

function coreAffairContractValid(affair: Affair): boolean {
  return Boolean(
    affair.domainId &&
      affair.context &&
      Array.isArray(affair.context.associatedDomains) &&
      affair.plan &&
      Array.isArray(affair.plan.objectives) &&
      affair.means &&
      Array.isArray(affair.means.selectedHeuristicIds)
  );
}

function coreInterestContractValid(interest: Interest): boolean {
  return Boolean(interest.domainId && Array.isArray(interest.objectives));
}

export interface DirectionalCompatibilitySummary {
  totalChecks: number;
  passedChecks: number;
  hardFailureCount: number;
  warningCount: number;
  directionalScore: number;
}

export interface DirectionalCompatibilityResult {
  hardFailures: string[];
  warnings: string[];
  compatibilitySummary: DirectionalCompatibilitySummary;
}

export function evaluateDirectionalCompatibility(data: AppData): DirectionalCompatibilityResult {
  const hardFailures: string[] = [];
  const warnings: string[] = [];
  let totalChecks = 0;
  let passedChecks = 0;

  const checkHard = (condition: boolean, message: string) => {
    totalChecks += 1;
    if (condition) {
      passedChecks += 1;
    } else {
      hardFailures.push(message);
    }
  };

  checkHard(data.domains.length > 0, "No domains found for War Room ontology.");
  checkHard(Array.isArray(data.affairs), "Affairs payload is missing.");
  checkHard(Array.isArray(data.interests), "Interests payload is missing.");

  const projections = projectDomainsToVolatilitySlots(data);
  const unresolvedDomains = projections.filter((projection) => !projection.sourceLabel);
  checkHard(
    unresolvedDomains.length === 0,
    `Domain-to-source resolvability failed for: ${unresolvedDomains.map((domain) => domain.domainName).join(", ")}`
  );

  const invalidAffairs = data.affairs.filter((affair) => !coreAffairContractValid(affair));
  checkHard(
    invalidAffairs.length === 0,
    `Affair core contract missing for: ${invalidAffairs.map((affair) => affair.title).slice(0, 5).join(", ")}`
  );

  const invalidInterests = data.interests.filter((interest) => !coreInterestContractValid(interest));
  checkHard(
    invalidInterests.length === 0,
    `Interest core contract missing for: ${invalidInterests.map((interest) => interest.title).slice(0, 5).join(", ")}`
  );

  const nonCanonicalSourceLabels = projections.filter((projection) => projection.sourceLabel && !projection.slotKey);
  if (nonCanonicalSourceLabels.length > 0) {
    warnings.push(
      `Non-canonical volatility labels mapped as warnings: ${nonCanonicalSourceLabels
        .map((projection) => `${projection.domainName} -> ${projection.sourceLabel}`)
        .slice(0, 8)
        .join("; ")}`
    );
  }

  const populatedSlots = new Set(projections.flatMap((projection) => (projection.slotKey ? [projection.slotKey] : [])));
  const missingSlots = CANONICAL_VOLATILITY_SLOTS.filter((slot) => !populatedSlots.has(slot.key)).map((slot) => slot.label);
  if (missingSlots.length > 0) {
    warnings.push(`Canonical volatility slots currently unpopulated: ${missingSlots.join(", ")}`);
  }

  const missingNarratives = data.domains.filter((domain) => {
    const fields = [
      domain.stakesText,
      domain.fragilityText,
      domain.vulnerabilitiesText,
      domain.hedge,
      domain.edge
    ];
    return fields.some((field) => !hasNonEmptyNarrativeField(field));
  });
  if (missingNarratives.length > 0) {
    warnings.push(`Optional narrative fields missing on ${missingNarratives.length} domain(s).`);
  }

  const stakesMissing = data.interests.filter((interest) => {
    if (typeof interest.stakes === "string") return interest.stakes.trim().length === 0;
    return interest.stakes === undefined;
  });
  if (stakesMissing.length > 0) {
    warnings.push(`Interests missing stakes field: ${stakesMissing.length}.`);
  }

  const actorTypes = new Set((data.lineages?.entities ?? []).map((entity) => String(entity.actorType).toLowerCase()));
  const missingActorTypes = ["personal", "private", "public"].filter((actorType) => !actorTypes.has(actorType));
  if (missingActorTypes.length > 0) {
    warnings.push(`Lineage actor-type coverage is partial; missing: ${missingActorTypes.join(", ")}.`);
  }

  const directionalScore = totalChecks === 0 ? 100 : Math.round((passedChecks / totalChecks) * 100);
  return {
    hardFailures,
    warnings,
    compatibilitySummary: {
      totalChecks,
      passedChecks,
      hardFailureCount: hardFailures.length,
      warningCount: warnings.length,
      directionalScore
    }
  };
}

export function parseRoutesFromSmokeScript(scriptContent: string): string[] {
  const matches = Array.from(scriptContent.matchAll(/"\/[^"]+"/g));
  return matches.map((match) => match[0].replaceAll("\"", ""));
}

export function groupLineageRisksBySourceAndDomain(risks: LineageRiskDto[] = []) {
  const bySource = new Map<string, LineageRiskDto[]>();
  const byDomain = new Map<string, LineageRiskDto[]>();
  for (const risk of risks) {
    const sourceBucket = bySource.get(risk.sourceId) ?? [];
    sourceBucket.push(risk);
    bySource.set(risk.sourceId, sourceBucket);

    const domainBucket = byDomain.get(risk.domainId) ?? [];
    domainBucket.push(risk);
    byDomain.set(risk.domainId, domainBucket);
  }
  return { bySource, byDomain };
}
