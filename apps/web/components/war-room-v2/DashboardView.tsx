import React from "react";
import { AppData, Domain } from "./types";
import { HUD } from "./HUD";
import { StrategyCircle } from "./StrategyCircle";
import { FragilityRadar } from "./FragilityRadar";
import { TaskKillChain } from "./TaskKillChain";
import { FragilityHierarchyView } from "./FragilityHierarchyView";

export function DashboardView({
  data,
  onOpenDomain,
  onWarGameSource,
  onWarGameDomain,
  onWarGameLineage
}: {
  data: AppData;
  onOpenDomain: (domain: Domain) => void;
  onWarGameSource?: (sourceId: string) => void;
  onWarGameDomain?: (domainId: string) => void;
  onWarGameLineage?: (lineageNodeId: string) => void;
}) {
  const [selectedSegment, setSelectedSegment] = React.useState<string>("Allies");

  const filteredPanel = React.useMemo(() => {
    const domainsById = new Map(data.domains.map((domain) => [domain.id, domain]));
    if (selectedSegment === "Allies") {
      const items = data.affairs.flatMap((affair) => (affair.strategy?.mapping?.allies ?? []).map((ally) => `${ally} • ${affair.title}`));
      return { title: "Allies", items: items.length ? items : ["No allies mapped yet."] };
    }
    if (selectedSegment === "Enemies") {
      const items = data.affairs.flatMap((affair) => (affair.strategy?.mapping?.enemies ?? []).map((enemy) => `${enemy} • ${affair.title}`));
      return { title: "Enemies", items: items.length ? items : ["No enemies mapped yet."] };
    }
    if (selectedSegment === "Offense") {
      const items = data.affairs
        .filter((affair) => (affair.strategy?.posture ?? "").toLowerCase() === "offense")
        .map((affair) => `${affair.title} • ${domainsById.get(affair.domainId)?.name ?? affair.domainId}`);
      return { title: "Offense", items: items.length ? items : ["No offense posture mapped."] };
    }
    if (selectedSegment === "Defense") {
      const items = data.affairs
        .filter((affair) => (affair.strategy?.posture ?? "").toLowerCase() !== "offense")
        .map((affair) => `${affair.title} • ${domainsById.get(affair.domainId)?.name ?? affair.domainId}`);
      return { title: "Defense", items: items.length ? items : ["No defense posture mapped."] };
    }
    if (selectedSegment === "Domains") {
      const items = data.domains.map((domain) => {
        const linkedAffairs = data.affairs.filter((affair) => affair.context?.associatedDomains?.includes(domain.id)).length;
        const linkedInterests = data.interests.filter((interest) => interest.domainId === domain.id).length;
        return `${domain.name} • affairs ${linkedAffairs} • interests ${linkedInterests}`;
      });
      return { title: "Domains", items: items.length ? items : ["No domains mapped."] };
    }
    if (selectedSegment === "Interests") {
      const items = data.interests.map((interest) => `${interest.title} • ${domainsById.get(interest.domainId)?.name ?? interest.domainId}`);
      return { title: "Interests", items: items.length ? items : ["No interests mapped."] };
    }
    const items = data.affairs.map((affair) => `${affair.title} • ${domainsById.get(affair.domainId)?.name ?? affair.domainId}`);
    return { title: "Affairs", items: items.length ? items : ["No affairs mapped."] };
  }, [data.affairs, data.domains, data.interests, selectedSegment]);

  return (
    <div className="max-w-7xl mx-auto px-3 py-5">
      <HUD user={data.user} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <StrategyCircle data={data} onSegmentClick={setSelectedSegment} selectedSegment={selectedSegment} />
        <FragilityRadar domains={data.domains} affairs={data.affairs} sources={data.sources} lineageRisks={data.lineageRisks} />
        <TaskKillChain tasks={data.tasks} />
      </div>

      <section className="glass p-4 rounded-lg border border-white/10 mb-6">
        <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-2">Strategic Posture Filter</div>
        <h3 className="text-sm font-bold uppercase tracking-widest mb-3">{filteredPanel.title}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
          {filteredPanel.items.map((item) => (
            <div key={`${filteredPanel.title}-${item}`} className="text-xs text-zinc-200 border border-white/10 rounded-md bg-zinc-950/50 px-2.5 py-2">
              {item}
            </div>
          ))}
        </div>
      </section>

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
