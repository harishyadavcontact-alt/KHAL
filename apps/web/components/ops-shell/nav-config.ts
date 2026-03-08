import type { LucideIcon } from "lucide-react";
import {
  Anchor,
  FlaskConical,
  Briefcase,
  Clock3,
  Compass,
  Crosshair,
  Database,
  Hexagon,
  Home,
  LayoutDashboard,
  Map as MapIcon,
  Network,
  NotebookPen,
  Sword,
  Zap
} from "lucide-react";

export type KhalOpsNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  matchPrefixes?: string[];
};

export const KHAL_OPS_NAV_ITEMS: KhalOpsNavItem[] = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/war-room", label: "War Room", icon: MapIcon },
  { href: "/missionCommand", label: "Mission Command", icon: Compass, matchPrefixes: ["/mission-command", "/portfolio"] },
  { href: "/source-of-volatility", label: "Source of Volatility", icon: Sword, matchPrefixes: ["/laws"] },
  { href: "/maya", label: "Maya", icon: Hexagon },
  { href: "/interests", label: "Interests", icon: Anchor },
  { href: "/lab", label: "Lab", icon: FlaskConical },
  { href: "/affairs", label: "Affairs", icon: Briefcase },
  { href: "/war-gaming", label: "War Gaming", icon: Zap },
  { href: "/surgical-execution", label: "Surgical Execution", icon: Crosshair },
  { href: "/crafts-library", label: "Crafts Library", icon: Database, matchPrefixes: ["/crafts"] },
  { href: "/time-horizon", label: "Time Horizon", icon: Clock3 },
  { href: "/lineage-map", label: "Lineage Map", icon: Network, matchPrefixes: ["/lineages"] },
  { href: "/drafts", label: "Drafts", icon: NotebookPen }
];

export const KHAL_OPS_BYPASS_PREFIXES = [
  "/dashboard",
  "/war-room",
  "/missionCommand",
  "/mission-command",
  "/portfolio",
  "/source-of-volatility",
  "/maya",
  "/laws",
  "/interests",
  "/lab",
  "/affairs",
  "/war-gaming",
  "/surgical-execution",
  "/crafts-library",
  "/crafts",
  "/time-horizon",
  "/lineage-map",
  "/lineages",
  "/drafts",
  "/brand",
  "/khal",
  "/home"
] as const;
