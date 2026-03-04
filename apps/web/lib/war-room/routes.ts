import type { WarRoomViewState } from "../../components/war-room-v2/types";

export function routeForView(view: WarRoomViewState): string {
  if (view === "dashboard") return "/dashboard";
  if (view === "war-room") return "/war-room";
  if (view === "mission") return "/missionCommand";
  if (view === "laws") return "/source-of-volatility";
  if (view === "interests") return "/interests";
  if (view === "lab") return "/lab";
  if (view === "affairs") return "/affairs";
  if (view === "war-gaming") return "/war-gaming/affair";
  if (view === "execution") return "/surgical-execution";
  if (view === "crafts") return "/crafts-library";
  if (view === "time-horizon") return "/time-horizon";
  if (view === "lineages") return "/lineage-map";
  return "/dashboard";
}

