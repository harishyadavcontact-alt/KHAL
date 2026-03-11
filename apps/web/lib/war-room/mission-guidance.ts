import type { Affair, Domain, Interest, SourceMapProfileDto, VolatilitySourceDto } from "../../components/war-room-v2/types";
import type { WarGameDoctrineChain } from "./bootstrap";
import { doctrineWarningsForProfile } from "../doctrine/gaps";

export interface MissionDoctrineReference {
  sourceId: string;
  sourceName: string;
  domainId: string;
  domainName: string;
  warnings: string[];
}

export interface MissionGuidanceItem {
  id: string;
  kind: "Affair" | "Interest";
  title: string;
  domainId: string;
  doctrineRefs: MissionDoctrineReference[];
}

export interface MissionGuidanceSnapshot {
  recommendedOrder: MissionGuidanceItem[];
  doctrineLinkedRecords: MissionGuidanceItem[];
}

function mapProfilesWithContext(sources: VolatilitySourceDto[], domains: Domain[]) {
  const domainNameById = new Map(domains.map((domain) => [domain.id, domain.name]));
  const out: Array<{
    profile: SourceMapProfileDto;
    sourceName: string;
    domainName: string;
  }> = [];

  for (const source of sources) {
    for (const profile of source.mapProfiles ?? []) {
      out.push({
        profile,
        sourceName: source.name,
        domainName: domainNameById.get(profile.domainId) ?? profile.domainId
      });
    }
  }

  return out;
}

export function buildMissionGuidance(args: {
  affairs: Affair[];
  interests: Interest[];
  sources?: VolatilitySourceDto[];
  domains?: Domain[];
  responseLogic?: WarGameDoctrineChain[];
}): MissionGuidanceSnapshot {
  const sources = args.sources ?? [];
  const domains = args.domains ?? [];
  const responseLogic = args.responseLogic ?? [];
  const profiles = mapProfilesWithContext(sources, domains);

  const refsByAffairId = new Map<string, MissionDoctrineReference[]>();
  const refsByInterestId = new Map<string, MissionDoctrineReference[]>();

  for (const { profile, sourceName, domainName } of profiles) {
    const warnings = doctrineWarningsForProfile(profile, responseLogic);
    if (!warnings.length) continue;

    const ref: MissionDoctrineReference = {
      sourceId: profile.sourceId,
      sourceName,
      domainId: profile.domainId,
      domainName,
      warnings
    };

    if (profile.affairId) {
      const list = refsByAffairId.get(profile.affairId) ?? [];
      list.push(ref);
      refsByAffairId.set(profile.affairId, list);
    }
    if (profile.interestId) {
      const list = refsByInterestId.get(profile.interestId) ?? [];
      list.push(ref);
      refsByInterestId.set(profile.interestId, list);
    }
  }

  const recommendedOrder: MissionGuidanceItem[] = [
    ...[...args.affairs]
      .sort((left, right) => Number(right.stakes ?? 0) * Number(right.risk ?? 0) - Number(left.stakes ?? 0) * Number(left.risk ?? 0))
      .map((affair) => ({
        id: affair.id,
        kind: "Affair" as const,
        title: affair.title,
        domainId: affair.domainId,
        doctrineRefs: refsByAffairId.get(affair.id) ?? []
      })),
    ...[...args.interests]
      .sort((left, right) => Number(right.convexity ?? 0) - Number(left.convexity ?? 0))
      .map((interest) => ({
        id: interest.id,
        kind: "Interest" as const,
        title: interest.title,
        domainId: interest.domainId,
        doctrineRefs: refsByInterestId.get(interest.id) ?? []
      }))
  ].slice(0, 6);

  const doctrineLinkedRecords = recommendedOrder.filter((item) => item.doctrineRefs.length > 0);

  return {
    recommendedOrder,
    doctrineLinkedRecords
  };
}
