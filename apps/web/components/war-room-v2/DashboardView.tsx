import React from "react";
import { AppData, Domain, TriageEvaluationSnapshot } from "./types";
import { HUD } from "./HUD";
import { StrategyCircle } from "./StrategyCircle";
import { FragilityRadar } from "./FragilityRadar";
import { TaskKillChain } from "./TaskKillChain";
import { FragilityHierarchyView } from "./FragilityHierarchyView";
import { OperationalDoNowPanel } from "./maya/OperationalDoNowPanel";
import { StakesTriadPanel } from "./maya/StakesTriadPanel";
import { BarbellGuardrailPanel } from "./maya/BarbellGuardrailPanel";
import { AsymmetryCurvePanel } from "./maya/AsymmetryCurvePanel";
import { FogOfMayaPanel } from "./maya/FogOfMayaPanel";
import { ExecutionSplitPanel } from "./maya/ExecutionSplitPanel";
import { VirtueSpiralPanel } from "./VirtueSpiralPanel";
import { DoNowCopilotCard } from "./DoNowCopilotCard";
import { ProtocolStatusStrip } from "./ProtocolStatusStrip";
import { HudStatusStrip } from "./hud/HudStatusStrip";
import { LifeClockCard } from "./hud/LifeClockCard";
import { AlertQueuePanel } from "./hud/AlertQueuePanel";
import {
  BlackSwanReadinessPanel,
  ConfidenceEvidenceStrip,
  CounterfactualDeltaPanel,
  ExecutionDistributionPanel,
  FragilityHeatTimelinePanel,
  NoRuinTripwirePanel,
  OptionalityBudgetPanel,
  RuinLedgerPanel,
  ViaNegativaPanel
} from "./panels/RobustnessPanels";
import { NextActionStrip } from "./panels/NextActionStrip";
import { v03Flags } from "../../lib/war-room/feature-flags";
import {
  computeBlackSwanReadiness,
  computeExecutionDistribution,
  computeViaNegativaQueue
} from "../../lib/war-room/operational-metrics";

export function DashboardView({
  data,
  onOpenDomain,
  onWarGameSource,
  onWarGameDomain,
  onWarGameLineage,
  onQueueAction
}: {
  data: AppData;
  onOpenDomain: (domain: Domain) => void;
  onWarGameSource?: (sourceId: string) => void;
  onWarGameDomain?: (domainId: string) => void;
  onWarGameLineage?: (lineageNodeId: string) => void;
  onQueueAction?: () => Promise<void> | void;
}) {
  const [selectedSegment, setSelectedSegment] = React.useState<string>("Allies");
  const fallbackDecisionAcceleration = React.useMemo(() => ({
    virtueSpiral: {
      stage: "REDUCE_FRAGILITY" as const,
      score: 0,
      trend: "STABLE" as const,
      nextAction: "No decision telemetry available yet.",
      openFragilityMass: 0,
      convexityMass: 0,
      executionVelocity: 0
    },
    pathComparator: {
      unpreparedScore: 0,
      preparedScore: 0,
      delta: 0,
      ruinRisk: 0,
      survivalOdds: 0,
      timeToImpact: 0,
      resourceBurn: 0,
      criticalNode: "No critical node"
    },
    copilot: {
      promptState: "State telemetry unavailable.",
      suggestedAction: "Create one affair to seed execution.",
      rationale: "Without seeded obligations, the system cannot rank next actions.",
      ctaPayload: {
        title: "Seed first affair from dashboard copilot",
        sourceType: "PLAN" as const,
        sourceId: "mission-global",
        horizon: "WEEK" as const,
        notes: "Fallback copilot action."
      }
    }
  }), []);
  const decisionAcceleration = data.decisionAcceleration ?? fallbackDecisionAcceleration;
  const viaNegativa = React.useMemo(() => computeViaNegativaQueue(data, 5), [data]);
  const blackSwan = React.useMemo(() => computeBlackSwanReadiness(data), [data]);
  const executionDistribution = React.useMemo(() => computeExecutionDistribution(data), [data]);
  const [triage, setTriage] = React.useState<TriageEvaluationSnapshot | null>(null);
  const [actionNotice, setActionNotice] = React.useState("");
  const triageContext = React.useMemo(() => {
    if (data.interests.length) return { mode: "interest", targetId: data.interests[0].id };
    if (data.affairs.length) return { mode: "affair", targetId: data.affairs[0].id };
    if (data.domains.length) return { mode: "domain", targetId: data.domains[0].id };
    return { mode: "mission", targetId: "mission-global" };
  }, [data.affairs, data.domains, data.interests]);

  React.useEffect(() => {
    let cancelled = false;
    fetch("/api/decision/triage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...triageContext, role: "MISSIONARY", noRuinGate: true })
    })
      .then((res) => res.json())
      .then((payload) => {
        if (cancelled) return;
        setTriage(payload as TriageEvaluationSnapshot);
      })
      .catch(() => {
        if (cancelled) return;
        setTriage(null);
      });
    return () => {
      cancelled = true;
    };
  }, [triageContext]);

  const openWarGaming = React.useCallback((mode: string, targetId: string) => {
    if (typeof window !== "undefined") {
      window.location.assign(`/war-gaming/${mode}?target=${encodeURIComponent(targetId)}`);
    }
  }, []);

  const applyTriageAction = React.useCallback(
    async (suggestionId: string) => {
      const suggestion = triage?.suggestions.find((item) => item.id === suggestionId);
      if (!suggestion?.actionKind) return;
      try {
        const response = await fetch("/api/decision/quick-action", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            kind: suggestion.actionKind,
            targetRef: { mode: suggestion.mode, targetId: suggestion.targetId },
            payload: suggestion.actionPayload ?? {},
            role: "MISSIONARY",
            noRuinGate: true
          })
        });
        const payload = await response.json();
        if (!response.ok || payload?.error) {
          setActionNotice(String(payload?.error ?? "Quick action failed."));
          return;
        }
        if (payload?.evaluation) setTriage(payload.evaluation as TriageEvaluationSnapshot);
        setActionNotice(`Applied: ${suggestion.title}`);
      } catch {
        setActionNotice("Quick action failed.");
      }
    },
    [triage]
  );

  const filteredPanel = React.useMemo(() => {
    const domainsById = new Map(data.domains.map((domain) => [domain.id, domain]));
    if (selectedSegment === "Allies") {
      const items = data.affairs.flatMap((affair) => (affair.strategy?.mapping?.allies ?? []).map((ally) => `${ally} | ${affair.title}`));
      return { title: "Allies", items: items.length ? items : ["No allies mapped yet."] };
    }
    if (selectedSegment === "Enemies") {
      const items = data.affairs.flatMap((affair) => (affair.strategy?.mapping?.enemies ?? []).map((enemy) => `${enemy} | ${affair.title}`));
      return { title: "Enemies", items: items.length ? items : ["No enemies mapped yet."] };
    }
    if (selectedSegment === "Offense") {
      const items = data.affairs
        .filter((affair) => (affair.strategy?.posture ?? "").toLowerCase() === "offense")
        .map((affair) => `${affair.title} | ${domainsById.get(affair.domainId)?.name ?? affair.domainId}`);
      return { title: "Offense", items: items.length ? items : ["No offense posture mapped."] };
    }
    if (selectedSegment === "Defense") {
      const items = data.affairs
        .filter((affair) => (affair.strategy?.posture ?? "").toLowerCase() !== "offense")
        .map((affair) => `${affair.title} | ${domainsById.get(affair.domainId)?.name ?? affair.domainId}`);
      return { title: "Defense", items: items.length ? items : ["No defense posture mapped."] };
    }
    if (selectedSegment === "Domains") {
      const items = data.domains.map((domain) => {
        const linkedAffairs = data.affairs.filter((affair) => affair.context?.associatedDomains?.includes(domain.id)).length;
        const linkedInterests = data.interests.filter((interest) => interest.domainId === domain.id).length;
        return `${domain.name} | affairs ${linkedAffairs} | interests ${linkedInterests}`;
      });
      return { title: "Domains", items: items.length ? items : ["No domains mapped."] };
    }
    if (selectedSegment === "Interests") {
      const items = data.interests.map((interest) => `${interest.title} | ${domainsById.get(interest.domainId)?.name ?? interest.domainId}`);
      return { title: "Interests", items: items.length ? items : ["No interests mapped."] };
    }
    const items = data.affairs.map((affair) => `${affair.title} | ${domainsById.get(affair.domainId)?.name ?? affair.domainId}`);
    return { title: "Affairs", items: items.length ? items : ["No affairs mapped."] };
  }, [data.affairs, data.domains, data.interests, selectedSegment]);

  return (
    <div className="max-w-7xl mx-auto px-3 py-5">
      {v03Flags.hud && <HudStatusStrip data={data} />}
      <NextActionStrip triage={triage} onOpen={openWarGaming} onApplyAction={applyTriageAction} />
      {actionNotice ? <div className="mb-3 text-xs text-blue-300">{actionNotice}</div> : null}
      <HUD user={data.user} />
      <ProtocolStatusStrip meta={data.decisionAccelerationMeta} />
      {v03Flags.confidence && <ConfidenceEvidenceStrip confidence={data.confidence} protocolState={data.decisionAccelerationMeta?.protocolState} />}
      {v03Flags.tripwire && <NoRuinTripwirePanel tripwire={data.tripwire} />}
      {v03Flags.hud && <AlertQueuePanel data={data} compact />}
      <FogOfMayaPanel data={data} />

      <div className="grid grid-cols-1 xl:grid-cols-[1.5fr_1fr] gap-4 mb-6">
        <VirtueSpiralPanel spiral={decisionAcceleration.virtueSpiral} />
        <DoNowCopilotCard
          copilot={decisionAcceleration.copilot}
          onQueued={onQueueAction}
          blocked={data.tripwire?.riskyActionBlocked}
          blockedReason={data.tripwire?.reason}
        />
      </div>

      <OperationalDoNowPanel data={data} />

      <div className={`grid grid-cols-1 ${v03Flags.hud ? "lg:grid-cols-4" : "lg:grid-cols-3"} gap-4 mb-6`}>
        {v03Flags.hud && <LifeClockCard data={data} />}
        <StakesTriadPanel data={data} />
        <BarbellGuardrailPanel data={data} />
        <ExecutionSplitPanel data={data} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {v03Flags.optionality && <OptionalityBudgetPanel state={data.optionalityBudget} />}
        <FragilityHeatTimelinePanel points={data.fragilityTimeline} />
        <CounterfactualDeltaPanel data={data} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <RuinLedgerPanel items={data.ruinLedger} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <ViaNegativaPanel items={viaNegativa} />
        <BlackSwanReadinessPanel snapshot={blackSwan} />
        <ExecutionDistributionPanel snapshot={executionDistribution} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <StrategyCircle data={data} onSegmentClick={setSelectedSegment} selectedSegment={selectedSegment} />
        <FragilityRadar domains={data.domains} affairs={data.affairs} sources={data.sources} lineageRisks={data.lineageRisks} />
        <TaskKillChain tasks={data.tasks} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <AsymmetryCurvePanel data={data} />
        <section className="glass p-4 rounded-xl border border-white/10 lg:col-span-2">
          <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-2">Strategic Posture Filter</div>
          <h3 className="text-sm font-bold uppercase tracking-widest mb-3 text-zinc-100">{filteredPanel.title}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {filteredPanel.items.map((item) => (
              <div
                key={`${filteredPanel.title}-${item}`}
                className="text-xs text-zinc-200 border border-white/10 rounded-md bg-zinc-950/55 px-2.5 py-2"
              >
                {item}
              </div>
            ))}
          </div>
        </section>
      </div>

      <FragilityHierarchyView
        data={data}
        onOpenDomain={onOpenDomain}
        onWarGameSource={onWarGameSource}
        onWarGameDomain={onWarGameDomain}
        onWarGameLineage={onWarGameLineage}
      />
    </div>
  );
}
