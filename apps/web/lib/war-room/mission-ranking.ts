import type { Affair, Interest, VolatilitySourceDto } from "../../components/war-room-v2/types";
import type { WarGameDoctrineChain } from "./bootstrap";
import { doctrineGapReason, unresolvedDoctrineGapByDomain } from "../doctrine/gaps";

export interface MissionRecommendedOrderItem {
  id: string;
  kind: "Affair" | "Interest";
  title: string;
  penalizedByDoctrineGap: boolean;
  doctrineGapReason?: string;
}

export function doctrineGapByDomainReadable(sources: VolatilitySourceDto[] = [], responseLogic: WarGameDoctrineChain[] = []): Map<string, string> {
  return new Map(
    Array.from(unresolvedDoctrineGapByDomain(sources, responseLogic).entries()).map(([domainId, code]) => [domainId, doctrineGapReason(code)])
  );
}

export function buildMissionRecommendedOrder(args: {
  affairs: Affair[];
  interests: Interest[];
  doctrineGapByDomain?: Map<string, string>;
}): MissionRecommendedOrderItem[] {
  const doctrineGapByDomain = args.doctrineGapByDomain ?? new Map<string, string>();

  const orderedAffairs = [...args.affairs]
    .map((affair) => {
      const doctrineGapReason = doctrineGapByDomain.get(affair.domainId);
      const baseScore = Number(affair.stakes ?? 0) * Number(affair.risk ?? 0);
      const adjustedScore = baseScore - (doctrineGapReason ? 25 : 0);
      return {
        id: affair.id,
        kind: "Affair" as const,
        title: affair.title,
        doctrineGapReason,
        penalizedByDoctrineGap: Boolean(doctrineGapReason),
        adjustedScore
      };
    })
    .sort((left, right) => right.adjustedScore - left.adjustedScore || left.title.localeCompare(right.title));

  const orderedInterests = [...args.interests]
    .map((interest) => {
      const doctrineGapReason = doctrineGapByDomain.get(interest.domainId);
      const baseScore = Number(interest.convexity ?? 0);
      const adjustedScore = baseScore - (doctrineGapReason ? 25 : 0);
      return {
        id: interest.id,
        kind: "Interest" as const,
        title: interest.title,
        doctrineGapReason,
        penalizedByDoctrineGap: Boolean(doctrineGapReason),
        adjustedScore
      };
    })
    .sort((left, right) => right.adjustedScore - left.adjustedScore || left.title.localeCompare(right.title));

  return [...orderedAffairs, ...orderedInterests]
    .map(({ adjustedScore: _adjustedScore, ...item }) => item)
    .slice(0, 6);
}
