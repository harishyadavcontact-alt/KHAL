export type CanonicalLawSlot = "universe" | "nature" | "nurture" | "land" | "time" | "law6";

const SLOT_ALIAS: Record<CanonicalLawSlot, string> = {
  universe: "Universe / Physics",
  nature: "Nature",
  nurture: "Nurture",
  land: "Land (Politics)",
  time: "Trade (Time)",
  law6: "Jungle"
};

function normalize(input?: string | null): string {
  return (input ?? "").trim().toLowerCase();
}

export function canonicalSlotFromLabel(label?: string | null): CanonicalLawSlot | null {
  const token = normalize(label);
  if (!token) return null;
  if (token.includes("universe") || token.includes("physics")) return "universe";
  if (token.includes("nature")) return "nature";
  if (token.includes("nurture")) return "nurture";
  if (token.includes("land") || token.includes("politic")) return "land";
  if (token.includes("time") || token.includes("trade")) return "time";
  if (token.includes("jungle") || token.includes("law 6") || token.includes("law6") || token.includes("tbd")) return "law6";
  return null;
}

export function lawAliasForSlot(slot?: CanonicalLawSlot | null): string | null {
  if (!slot) return null;
  return SLOT_ALIAS[slot] ?? null;
}

export function lawAliasForLabel(label?: string | null): string {
  const slot = canonicalSlotFromLabel(label);
  if (!slot) return (label ?? "").trim();
  return SLOT_ALIAS[slot];
}
