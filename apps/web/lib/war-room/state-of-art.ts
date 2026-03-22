import type {
  Affair,
  Craft,
  Domain,
  Interest,
  SourceDoctrineChainPreview,
  SourceMapProfileDto,
  SourceWarGameProtocol,
  SourceDomainProtocolSummary,
  StateOfArtStepId,
  StateOfArtDriftCheck,
  StateOfArtProjection,
  StateOfArtStepProtocol,
  LineageNodeDto,
  LineageRiskDto,
  VolatilitySourceDto
} from "../../components/war-room-v2/types";
import type { WarGameDoctrineChain } from "./bootstrap";

const SOURCE_STEP_ORDER: Array<{ id: StateOfArtStepId; label: string; prompt: string; doctrinePrompt: string }> = [
  {
    id: "map",
    label: "Map",
    prompt: "Classify decision structure, tail behavior, and quadrant.",
    doctrinePrompt: "Use scenarios to understand what kind of world this source-domain pair can throw at you before you decide on methods."
  },
  {
    id: "stone",
    label: "Stone",
    prompt: "Diagnose stakes, risks, odds, repeat rate, fragility, and lineage exposure.",
    doctrinePrompt: "Use threats to pressure-test risks, odds, repeat rate, fragility, and lineage exposure instead of treating them as abstract prose."
  },
  {
    id: "ends",
    label: "Ends",
    prompt: "Set the barbell: hedge for robustness, edge for optionality.",
    doctrinePrompt: "Use available responses to sharpen what belongs in hedge versus edge."
  },
  {
    id: "means",
    label: "Means",
    prompt: "Choose craft, heuristics, and what to avoid.",
    doctrinePrompt: "Choose craft to narrow doctrine chains, then prefer heuristics and responses that fit the quadrant."
  }
];

function normalize(text?: string | null): string {
  return String(text ?? "").trim().toLowerCase();
}

function includesNormalized(haystack?: string | null, needle?: string | null): boolean {
  const hay = normalize(haystack);
  const ned = normalize(needle);
  if (!hay || !ned) return false;
  return hay.includes(ned);
}

function shortVolatilityLabel(fragilityPosture?: string): string | undefined {
  const value = normalize(fragilityPosture);
  if (value === "fragile") return "Short volatility";
  if (value === "robust") return "Bounded / robust";
  if (value === "antifragile") return "Long volatility";
  return fragilityPosture?.trim() || undefined;
}

export function buildStateOfArtProjection(args: {
  profile: SourceMapProfileDto;
  source?: VolatilitySourceDto;
  domain?: Domain;
  crafts?: Array<Pick<Craft, "id" | "name">>;
}): StateOfArtProjection {
  const craftName = args.crafts?.find((craft) => craft.id === args.profile.primaryCraftId)?.name;
  return {
    sourceId: args.profile.sourceId,
    sourceName: args.source?.name ?? args.profile.sourceId,
    domainId: args.profile.domainId,
    domainName: args.domain?.name ?? args.profile.domainId,
    profileId: args.profile.id,
    quadrant: args.profile.quadrant,
    decisionType: args.profile.decisionType,
    tailClass: args.profile.tailClass,
    methodPosture: args.profile.methodPosture,
    stone: {
      asymmetry: {
        skinInTheGame: {
          stakes: args.profile.stakesText,
          risks: args.profile.risksText,
          odds: args.profile.oddsText,
          oddsBand: args.profile.oddsBand,
          repeatRate: args.profile.repeatRateText,
          baseRate: args.profile.baseRateText,
          triggerCondition: args.profile.triggerConditionText,
          survivalImpact: args.profile.survivalImpact,
          lineage: args.profile.lineageThreatText,
          players: args.profile.playersText
        }
      },
      nonLinearity: {
        fragilityPosture: args.profile.fragilityPosture,
        shortVolatilityLabel: shortVolatilityLabel(args.profile.fragilityPosture),
        vulnerabilities: args.profile.vulnerabilitiesText
      }
    },
    ends: {
      hedge: args.profile.hedgeText,
      edge: args.profile.edgeText
    },
    means: {
      primaryCraftId: args.profile.primaryCraftId,
      primaryCraftName: craftName,
      heuristics: args.profile.heuristicsText,
      avoid: args.profile.avoidText
    },
    links: {
      affairId: args.profile.affairId,
      interestId: args.profile.interestId
    }
  };
}

function sourceStepCompletion(profile?: SourceMapProfileDto | null): Record<StateOfArtStepId, boolean> {
  return {
    map: Boolean(profile?.decisionType && profile?.tailClass && profile?.quadrant && profile?.methodPosture),
    stone: Boolean(
      profile?.stakesText?.trim() &&
      profile?.risksText?.trim() &&
      profile?.oddsText?.trim() &&
      profile?.oddsBand &&
      profile?.repeatRateText?.trim() &&
      profile?.survivalImpact &&
      profile?.fragilityPosture?.trim() &&
      profile?.vulnerabilitiesText?.trim()
    ),
    ends: Boolean(profile?.hedgeText?.trim() && profile?.edgeText?.trim()),
    means: Boolean(profile?.primaryCraftId?.trim() && profile?.heuristicsText?.trim() && profile?.avoidText?.trim())
  };
}

function chainPreview(chain: WarGameDoctrineChain): SourceDoctrineChainPreview {
  const scenarioCount = chain.scenarios.length;
  const threatCount = chain.scenarios.reduce((sum, scenario) => sum + scenario.threats.length, 0);
  const responseCount = chain.scenarios.reduce(
    (sum, scenario) => sum + scenario.threats.reduce((inner, threat) => inner + threat.responses.length, 0),
    0
  );
  return {
    id: chain.id,
    craftId: chain.craftId,
    craftName: chain.craftName,
    name: chain.name,
    objective: chain.objective,
    scenarioCount,
    threatCount,
    responseCount
  };
}

function doctrineChainsForProfile(args: {
  profile?: SourceMapProfileDto;
  responseLogic?: WarGameDoctrineChain[];
}): SourceDoctrineChainPreview[] {
  const responseLogic = args.responseLogic ?? [];
  if (!responseLogic.length) return [];
  const matched = args.profile?.primaryCraftId
    ? responseLogic.filter((chain) => chain.craftId === args.profile?.primaryCraftId)
    : responseLogic;
  const rows = (matched.length ? matched : responseLogic).slice(0, 4);
  return rows.map(chainPreview);
}

export function buildSourceWarGameProtocol(args: {
  sourceId?: string;
  sources: VolatilitySourceDto[];
  domains: Domain[];
  lineages: LineageNodeDto[];
  lineageRisks: LineageRiskDto[];
  crafts?: Array<Pick<Craft, "id" | "name">>;
  responseLogic?: WarGameDoctrineChain[];
}): SourceWarGameProtocol {
  const source = args.sources.find((item) => item.id === args.sourceId);
  const linkedDomainIds = new Set(
    (source?.domains?.length
      ? source.domains.map((link) => link.domainId)
      : args.domains.filter((domain) => domain.volatilitySourceId === args.sourceId).map((domain) => domain.id))
  );
  const linkedDomains = args.domains.filter((domain) => linkedDomainIds.has(domain.id));
  const profiles = new Map((source?.mapProfiles ?? []).map((profile) => [profile.domainId, profile]));
  const sourceRisks = args.lineageRisks.filter((risk) => risk.sourceId === args.sourceId);
  const affectedLineages = args.lineages.filter((lineage) => sourceRisks.some((risk) => risk.lineageNodeId === lineage.id)).map((lineage) => lineage.level);

  const domainSummaries: SourceDomainProtocolSummary[] = linkedDomains.map((domain) => {
    const profile = profiles.get(domain.id);
    const projection = profile
      ? buildStateOfArtProjection({
          profile,
          source,
          domain,
          crafts: args.crafts
        })
      : undefined;
    const stepCompletion = sourceStepCompletion(profile);
    return {
      domainId: domain.id,
      domainName: domain.name,
      profileId: profile?.id,
      quadrant: profile?.quadrant,
      methodPosture: profile?.methodPosture,
      stepCompletion,
      canCreateAffair: Boolean(profile?.hedgeText?.trim()),
      canCreateInterest: Boolean(profile?.edgeText?.trim()),
      linkedAffairId: profile?.affairId,
      linkedInterestId: profile?.interestId,
      projection,
      doctrineChains: doctrineChainsForProfile({ profile, responseLogic: args.responseLogic })
    };
  });

  const steps: StateOfArtStepProtocol[] = SOURCE_STEP_ORDER.map((step) => {
    const coverageCount = domainSummaries.filter((domain) => domain.stepCompletion[step.id]).length;
    return {
      id: step.id,
      label: step.label,
      prompt: step.prompt,
      doctrinePrompt: step.doctrinePrompt,
      coverageCount,
      totalCount: linkedDomains.length,
      complete: linkedDomains.length > 0 && coverageCount === linkedDomains.length
    };
  });

  return {
    sourceId: source?.id,
    sourceName: source?.name,
    meansRule: "Quadrant determines admissible means; crafts and heuristics refine the posture.",
    linkedDomainCount: linkedDomains.length,
    affectedLineages,
    riskCount: sourceRisks.length,
    completedMapCount: domainSummaries.filter((domain) => domain.stepCompletion.map).length,
    steps,
    domains: domainSummaries
  };
}

export function projectionsByDomain(args: {
  sources: VolatilitySourceDto[];
  domains: Domain[];
  crafts?: Array<Pick<Craft, "id" | "name">>;
}): Map<string, StateOfArtProjection[]> {
  const domainById = new Map(args.domains.map((domain) => [domain.id, domain]));
  const out = new Map<string, StateOfArtProjection[]>();
  for (const source of args.sources) {
    for (const profile of source.mapProfiles ?? []) {
      const rows = out.get(profile.domainId) ?? [];
      rows.push(
        buildStateOfArtProjection({
          profile,
          source,
          domain: domainById.get(profile.domainId),
          crafts: args.crafts
        })
      );
      out.set(profile.domainId, rows);
    }
  }
  return out;
}

export function projectionForAffair(args: {
  affairId?: string;
  sources: VolatilitySourceDto[];
  domains: Domain[];
  crafts?: Array<Pick<Craft, "id" | "name">>;
}): StateOfArtProjection | null {
  if (!args.affairId) return null;
  const domainById = new Map(args.domains.map((domain) => [domain.id, domain]));
  for (const source of args.sources) {
    const profile = (source.mapProfiles ?? []).find((item) => item.affairId === args.affairId);
    if (!profile) continue;
    return buildStateOfArtProjection({
      profile,
      source,
      domain: domainById.get(profile.domainId),
      crafts: args.crafts
    });
  }
  return null;
}

export function projectionForInterest(args: {
  interestId?: string;
  sources: VolatilitySourceDto[];
  domains: Domain[];
  crafts?: Array<Pick<Craft, "id" | "name">>;
}): StateOfArtProjection | null {
  if (!args.interestId) return null;
  const domainById = new Map(args.domains.map((domain) => [domain.id, domain]));
  for (const source of args.sources) {
    const profile = (source.mapProfiles ?? []).find((item) => item.interestId === args.interestId);
    if (!profile) continue;
    return buildStateOfArtProjection({
      profile,
      source,
      domain: domainById.get(profile.domainId),
      crafts: args.crafts
    });
  }
  return null;
}

export function affairProjectionDrift(args: { affair?: Affair; projection: StateOfArtProjection | null }): StateOfArtDriftCheck[] {
  const { affair, projection } = args;
  if (!affair || !projection) return [];
  return [
    {
      id: "affair-link",
      label: "Source link",
      status: projection.links.affairId === affair.id ? "aligned" : "drifted",
      detail: projection.links.affairId === affair.id ? "Affair is still linked to the source-map profile." : "Affair link no longer matches the source-map profile."
    },
    {
      id: "affair-craft",
      label: "Means craft",
      status: affair.means?.craftId === projection.means.primaryCraftId ? "aligned" : affair.means?.craftId ? "drifted" : "missing",
      detail: affair.means?.craftId === projection.means.primaryCraftId
        ? "Affair means still use the source-selected craft."
        : affair.means?.craftId
          ? `Affair uses ${affair.means.craftId}; source-map recommends ${projection.means.primaryCraftId ?? "none"}.`
          : "Affair has no assigned means craft."
    },
    {
      id: "affair-hedge",
      label: "Hedge objective",
      status: (affair.plan?.objectives ?? []).some((objective) => includesNormalized(objective, projection.ends.hedge)) ? "aligned" : "missing",
      detail: (affair.plan?.objectives ?? []).some((objective) => includesNormalized(objective, projection.ends.hedge))
        ? "Affair plan still carries the hedge objective."
        : "Affair plan no longer carries the source hedge explicitly."
    }
  ];
}

export function interestProjectionDrift(args: { interest?: Interest; projection: StateOfArtProjection | null }): StateOfArtDriftCheck[] {
  const { interest, projection } = args;
  if (!interest || !projection) return [];
  return [
    {
      id: "interest-link",
      label: "Source link",
      status: projection.links.interestId === interest.id ? "aligned" : "drifted",
      detail: projection.links.interestId === interest.id ? "Interest is still linked to the source-map profile." : "Interest link no longer matches the source-map profile."
    },
    {
      id: "interest-hypothesis",
      label: "Edge hypothesis",
      status: includesNormalized(interest.hypothesis, projection.ends.edge) ? "aligned" : interest.hypothesis ? "drifted" : "missing",
      detail: includesNormalized(interest.hypothesis, projection.ends.edge)
        ? "Interest hypothesis still reflects the source edge."
        : interest.hypothesis
          ? "Interest hypothesis drifted away from the source edge."
          : "Interest has no hypothesis."
    },
    {
      id: "interest-downside",
      label: "Avoid / downside",
      status: includesNormalized(interest.downside, projection.means.avoid) || includesNormalized(interest.downside, projection.stone.asymmetry.skinInTheGame.risks) ? "aligned" : interest.downside ? "drifted" : "missing",
      detail: includesNormalized(interest.downside, projection.means.avoid) || includesNormalized(interest.downside, projection.stone.asymmetry.skinInTheGame.risks)
        ? "Interest downside still reflects avoid/risk guidance."
        : interest.downside
          ? "Interest downside no longer matches source avoid/risk guidance."
          : "Interest has no downside discipline text."
    },
    {
      id: "interest-evidence",
      label: "Heuristic evidence",
      status: includesNormalized(interest.evidenceNote, projection.means.heuristics) ? "aligned" : interest.evidenceNote ? "drifted" : "missing",
      detail: includesNormalized(interest.evidenceNote, projection.means.heuristics)
        ? "Evidence note still reflects source heuristics."
        : interest.evidenceNote
          ? "Evidence note drifted away from the source heuristics."
          : "Interest has no heuristic/evidence note."
    }
  ];
}
