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
import { KHAL_OPS_BYPASS_PREFIXES, KHAL_OPS_SECTIONS } from "../../lib/navigation/sections";

export type KhalOpsNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  matchPrefixes?: string[];
};

const ICON_BY_HREF: Record<string, LucideIcon> = {
  "/home": Home,
  "/dashboard": LayoutDashboard,
  "/war-room": MapIcon,
  "/missionCommand": Compass,
  "/vision-command": Compass,
  "/source-of-volatility": Sword,
  "/maya": Hexagon,
  "/interests": Anchor,
  "/lab": FlaskConical,
  "/affairs": Briefcase,
  "/war-gaming": Zap,
  "/surgical-execution": Crosshair,
  "/crafts-library": Database,
  "/time-horizon": Clock3,
  "/lineage-map": Network,
  "/drafts": NotebookPen
};

export const KHAL_OPS_NAV_ITEMS: KhalOpsNavItem[] = KHAL_OPS_SECTIONS.map((section) => ({
  href: section.href,
  label: section.label,
  icon: ICON_BY_HREF[section.href],
  matchPrefixes: section.matchPrefixes.filter((prefix) => prefix !== section.href)
}));
