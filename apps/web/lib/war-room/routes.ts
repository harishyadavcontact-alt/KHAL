import type { WarRoomViewState } from "../../components/war-room-v2/types";
import { routeForSectionView } from "../navigation/sections";

export function routeForView(view: WarRoomViewState): string {
  return routeForSectionView(view);
}

