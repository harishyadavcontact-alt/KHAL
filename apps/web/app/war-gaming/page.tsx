import { redirect } from "next/navigation";
import { DEFAULT_WARGAME_ROUTE } from "../../lib/decision-tree/registry";

export default function WarGamingLandingPage() {
  redirect(DEFAULT_WARGAME_ROUTE);
}

