import { notFound } from "next/navigation";
import { WarGamingModeClient } from "../../../components/ops-pages/WarGamingModeClient";
import { parseWarGameRouteMode } from "../../../lib/war-room/route-mode";

export default async function WarGamingModePage({
  params,
  searchParams
}: {
  params: Promise<{ mode: string }>;
  searchParams: Promise<{ target?: string; onboarding?: string }>;
}) {
  const resolvedParams = await params;
  const resolvedSearch = await searchParams;
  const mode = parseWarGameRouteMode(resolvedParams.mode);
  if (!mode) notFound();
  return <WarGamingModeClient mode={mode} targetId={resolvedSearch.target} onboarding={resolvedSearch.onboarding === "1"} />;
}

