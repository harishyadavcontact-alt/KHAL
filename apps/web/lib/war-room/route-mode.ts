import { isDecisionTreeMode, parseDecisionTreeMode, type DecisionTreeModeId } from "../decision-tree/registry";

export type WarGameRouteMode = DecisionTreeModeId;

export function isWarGameRouteMode(value: string): value is WarGameRouteMode {
  return isDecisionTreeMode(value);
}

export function parseWarGameRouteMode(value?: string | null): WarGameRouteMode | null {
  return parseDecisionTreeMode(value);
}

