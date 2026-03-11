import { DEFAULT_WARGAME_ROUTE } from "../decision-tree/registry";

export type SectionViewId =
  | "dashboard"
  | "war-room"
  | "mission"
  | "laws"
  | "interests"
  | "lab"
  | "affairs"
  | "war-gaming"
  | "execution"
  | "crafts"
  | "time-horizon"
  | "lineages";

export interface KhalSectionDefinition {
  id: string;
  href: string;
  label: string;
  moduleCopy: string;
  matchPrefixes: string[];
  view?: SectionViewId;
  includeInOpsNav?: boolean;
  includeInAppShell?: boolean;
}

export const KHAL_SECTIONS: readonly KhalSectionDefinition[] = [
  {
    id: "home",
    href: "/home",
    label: "Home",
    moduleCopy: "Operational launch surface",
    matchPrefixes: ["/home"],
    includeInOpsNav: true,
    includeInAppShell: true
  },
  {
    id: "dashboard",
    href: "/dashboard",
    label: "Dashboard",
    moduleCopy: "Temporal, posture, and fragility view",
    matchPrefixes: ["/dashboard"],
    view: "dashboard",
    includeInOpsNav: true,
    includeInAppShell: true
  },
  {
    id: "war-room",
    href: "/war-room",
    label: "War Room",
    moduleCopy: "Macro domain command center",
    matchPrefixes: ["/war-room"],
    view: "war-room",
    includeInOpsNav: true,
    includeInAppShell: true
  },
  {
    id: "mission-command",
    href: "/missionCommand",
    label: "Mission Command",
    moduleCopy: "Mission hierarchy and chain of command",
    matchPrefixes: ["/missionCommand", "/mission-command", "/portfolio"],
    view: "mission",
    includeInOpsNav: true,
    includeInAppShell: true
  },
  {
    id: "vision-command",
    href: "/vision-command",
    label: "Vision Command",
    moduleCopy: "Read-only synthesis for strategic narrative convergence",
    matchPrefixes: ["/vision-command"],
    includeInOpsNav: true
  },
  {
    id: "source-of-volatility",
    href: "/source-of-volatility",
    label: "Source of Volatility",
    moduleCopy: "Six-law volatility mapping",
    matchPrefixes: ["/source-of-volatility", "/laws"],
    view: "laws",
    includeInOpsNav: true
  },
  {
    id: "maya",
    href: "/maya",
    label: "Maya",
    moduleCopy: "Causal opacity flow and cave/convex split",
    matchPrefixes: ["/maya"],
    includeInOpsNav: true
  },
  {
    id: "interests",
    href: "/interests",
    label: "Interests",
    moduleCopy: "Optionality lane and convex upside",
    matchPrefixes: ["/interests"],
    view: "interests",
    includeInOpsNav: true
  },
  {
    id: "lab",
    href: "/lab",
    label: "Lab",
    moduleCopy: "Experiment protocol and asymmetry controls",
    matchPrefixes: ["/lab"],
    view: "lab",
    includeInOpsNav: true
  },
  {
    id: "affairs",
    href: "/affairs",
    label: "Affairs",
    moduleCopy: "Obligation lane and fragility removal",
    matchPrefixes: ["/affairs"],
    view: "affairs",
    includeInOpsNav: true
  },
  {
    id: "war-gaming",
    href: "/war-gaming",
    label: "War Gaming",
    moduleCopy: "Scenario simulation and planning",
    matchPrefixes: ["/war-gaming"],
    view: "war-gaming",
    includeInOpsNav: true,
    includeInAppShell: true
  },
  {
    id: "surgical-execution",
    href: "/surgical-execution",
    label: "Surgical Execution",
    moduleCopy: "Execution readiness and task chain",
    matchPrefixes: ["/surgical-execution"],
    view: "execution",
    includeInOpsNav: true
  },
  {
    id: "crafts-library",
    href: "/crafts-library",
    label: "Crafts Library",
    moduleCopy: "Means, models, frameworks, and heuristics",
    matchPrefixes: ["/crafts-library", "/crafts"],
    view: "crafts",
    includeInOpsNav: true
  },
  {
    id: "time-horizon",
    href: "/time-horizon",
    label: "Time Horizon",
    moduleCopy: "Temporal constraints and deadlines",
    matchPrefixes: ["/time-horizon"],
    view: "time-horizon",
    includeInOpsNav: true
  },
  {
    id: "lineage-map",
    href: "/lineage-map",
    label: "Lineage Map",
    moduleCopy: "Lineage exposure and links",
    matchPrefixes: ["/lineage-map", "/lineages"],
    view: "lineages",
    includeInOpsNav: true
  },
  {
    id: "drafts",
    href: "/drafts",
    label: "Drafts",
    moduleCopy: "Prose-first structural thinking workspace",
    matchPrefixes: ["/drafts"],
    includeInOpsNav: true
  }
] as const;

export const KHAL_SECTION_BY_HREF = new Map(KHAL_SECTIONS.map((section) => [section.href, section]));
export const KHAL_OPS_SECTIONS = KHAL_SECTIONS.filter((section) => section.includeInOpsNav);
export const KHAL_APP_SHELL_SECTIONS = KHAL_SECTIONS.filter((section) => section.includeInAppShell);
export const KHAL_MODULE_COPY = Object.fromEntries(KHAL_SECTIONS.map((section) => [section.href, section.moduleCopy])) as Record<string, string>;
export const KHAL_OPS_BYPASS_PREFIXES: string[] = [...new Set([...KHAL_OPS_SECTIONS.flatMap((section) => section.matchPrefixes), "/brand", "/khal"])];

export function routeForSectionView(view: SectionViewId): string {
  const section = KHAL_SECTIONS.find((entry) => entry.view === view);
  return section?.id === "war-gaming" ? DEFAULT_WARGAME_ROUTE : section?.href ?? "/dashboard";
}

export function viewForPath(pathname: string): SectionViewId | null {
  const section = KHAL_SECTIONS.find((entry) => entry.view && entry.matchPrefixes.some((prefix) => pathname.startsWith(prefix)));
  return section?.view ?? null;
}
