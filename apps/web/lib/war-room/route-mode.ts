export type WarGameRouteMode = "source" | "domain" | "affair" | "interest" | "mission" | "lineage";

const MODES: WarGameRouteMode[] = ["source", "domain", "affair", "interest", "mission", "lineage"];

export function isWarGameRouteMode(value: string): value is WarGameRouteMode {
  return MODES.includes(value as WarGameRouteMode);
}

export function parseWarGameRouteMode(value?: string | null): WarGameRouteMode | null {
  if (!value) return null;
  return isWarGameRouteMode(value) ? value : null;
}

