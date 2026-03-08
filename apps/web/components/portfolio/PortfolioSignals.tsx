import type { PortfolioProject, PortfolioSignalBand } from "@khal/domain";

export const PORTFOLIO_ROLE_OPTIONS: Array<PortfolioProject["strategicRole"] | "all"> = [
  "all",
  "core",
  "option",
  "probe",
  "archive",
  "killed"
];

export const PORTFOLIO_STAGE_OPTIONS: Array<PortfolioProject["stage"] | "all"> = [
  "all",
  "idea",
  "framing",
  "build",
  "shipping",
  "traction",
  "stalled",
  "archived"
];

export const PORTFOLIO_SIGNAL_OPTIONS: PortfolioSignalBand[] = ["high", "watch", "low"];

export function labelize(value: string) {
  return value.replace(/-/g, " ");
}

export function roleTone(role: PortfolioProject["strategicRole"]) {
  if (role === "core") return "border-[rgba(200,154,87,0.35)] bg-[rgba(200,154,87,0.16)] text-[var(--color-accent-strong)]";
  if (role === "option") return "border-[rgba(55,166,122,0.32)] bg-[rgba(55,166,122,0.15)] text-[var(--color-success)]";
  if (role === "probe") return "border-[rgba(124,140,157,0.35)] bg-[rgba(124,140,157,0.16)] text-[var(--color-accent-cool)]";
  if (role === "archive") return "border-white/10 bg-white/5 text-[var(--color-text-muted)]";
  return "border-[rgba(239,68,68,0.28)] bg-[rgba(239,68,68,0.14)] text-[var(--color-danger)]";
}

export function stageTone(stage: PortfolioProject["stage"]) {
  if (stage === "shipping") return "border-[rgba(55,166,122,0.32)] bg-[rgba(55,166,122,0.15)] text-[var(--color-success)]";
  if (stage === "traction") return "border-[rgba(200,154,87,0.35)] bg-[rgba(200,154,87,0.16)] text-[var(--color-accent-strong)]";
  if (stage === "stalled") return "border-[rgba(239,68,68,0.28)] bg-[rgba(239,68,68,0.14)] text-[var(--color-danger)]";
  if (stage === "archived") return "border-white/10 bg-white/5 text-[var(--color-text-muted)]";
  return "border-[rgba(124,140,157,0.35)] bg-[rgba(124,140,157,0.14)] text-[var(--color-text-muted)]";
}

export function signalTone(signalBand: PortfolioSignalBand) {
  if (signalBand === "high") return "border-[rgba(55,166,122,0.32)] bg-[rgba(55,166,122,0.16)] text-[var(--color-success)]";
  if (signalBand === "watch") return "border-[rgba(200,154,87,0.35)] bg-[rgba(200,154,87,0.16)] text-[var(--color-accent-strong)]";
  return "border-[rgba(239,68,68,0.28)] bg-[rgba(239,68,68,0.14)] text-[var(--color-danger)]";
}

export function signalBandLabel(signalBand: PortfolioSignalBand) {
  if (signalBand === "high") return "strong signal";
  if (signalBand === "low") return "weak signal";
  return "watch";
}

export function movementTone(movement: "shipping" | "watch" | "stalled" | "quiet") {
  if (movement === "shipping") return "text-[var(--color-success)]";
  if (movement === "watch") return "text-[var(--color-accent-strong)]";
  if (movement === "stalled") return "text-[var(--color-danger)]";
  return "text-[var(--color-text-muted)]";
}

export function signalBadgeClass(tone: string) {
  return `inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.18em] ${tone}`;
}
