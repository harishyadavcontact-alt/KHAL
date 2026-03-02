import React, { useMemo, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { PolarAngleAxis, PolarGrid, Radar, RadarChart, ResponsiveContainer } from "recharts";
import { Affair, Domain, LineageRiskDto, VolatilitySourceDto } from "./types";

type FragilityMode = "domain" | "source";

function average(values: number[]) {
  if (!values.length) return 0;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

export const FragilityRadar = ({
  domains,
  affairs,
  sources,
  lineageRisks
}: {
  domains: Domain[];
  affairs: Affair[];
  sources?: VolatilitySourceDto[];
  lineageRisks?: LineageRiskDto[];
}) => {
  const [mode, setMode] = useState<FragilityMode>("domain");

  const byDomain = useMemo(() => {
    const risks = lineageRisks ?? [];
    if (risks.length) {
      const map = new Map<string, number[]>();
      for (const risk of risks) {
        const list = map.get(risk.domainId) ?? [];
        list.push(Number(risk.fragilityScore ?? 0));
        map.set(risk.domainId, list);
      }
      return domains.map((domain) => ({
        subject: domain.name,
        score: average(map.get(domain.id) ?? [])
      }));
    }

    return domains.map((domain) => {
      const domainAffairs = affairs.filter((affair) => affair.context?.associatedDomains?.includes(domain.id));
      const proxyScores = domainAffairs.map((affair) => {
        const fragile = affair.entities?.filter((entity) => entity.fragility === "fragile").length ?? 0;
        return Math.min(100, 25 + fragile * 20);
      });
      return {
        subject: domain.name,
        score: average(proxyScores)
      };
    });
  }, [affairs, domains, lineageRisks]);

  const bySource = useMemo(() => {
    const risks = lineageRisks ?? [];
    const sourceById = new Map((sources ?? []).map((source) => [source.id, source.name]));
    if (risks.length) {
      const map = new Map<string, number[]>();
      for (const risk of risks) {
        const list = map.get(risk.sourceId) ?? [];
        list.push(Number(risk.fragilityScore ?? 0));
        map.set(risk.sourceId, list);
      }
      return Array.from(map.entries()).map(([id, values]) => ({
        subject: sourceById.get(id) ?? id,
        score: average(values)
      }));
    }

    const grouped = new Map<string, number[]>();
    for (const domain of domains) {
      const sourceName = domain.volatilitySourceName ?? domain.volatilitySource ?? "Unmapped";
      const domainAffairs = affairs.filter((affair) => affair.context?.associatedDomains?.includes(domain.id));
      const proxyScores = domainAffairs.map((affair) => {
        const fragile = affair.entities?.filter((entity) => entity.fragility === "fragile").length ?? 0;
        return Math.min(100, 25 + fragile * 20);
      });
      const bucket = grouped.get(sourceName) ?? [];
      bucket.push(average(proxyScores));
      grouped.set(sourceName, bucket);
    }
    return Array.from(grouped.entries()).map(([sourceName, values]) => ({
      subject: sourceName,
      score: average(values)
    }));
  }, [affairs, domains, lineageRisks, sources]);

  const chartData = (mode === "domain" ? byDomain : bySource).slice(0, 8).map((row) => ({
    subject: row.subject,
    fragility: row.score,
    fullMark: 100
  }));

  return (
    <div className="glass p-4 rounded-lg h-full border border-white/10">
      <div className="flex items-center justify-between gap-3 mb-3">
        <h3 className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
          <AlertTriangle className="text-red-400" size={16} />
          Fragility Mapping
        </h3>
        <div className="flex gap-1">
          <button
            onClick={() => setMode("domain")}
            className={
              mode === "domain"
                ? "px-2 py-1 rounded text-[10px] font-mono uppercase bg-blue-600 text-white"
                : "px-2 py-1 rounded text-[10px] font-mono uppercase bg-zinc-900 border border-white/10 text-zinc-400 hover:text-zinc-200"
            }
          >
            By Domain
          </button>
          <button
            onClick={() => setMode("source")}
            className={
              mode === "source"
                ? "px-2 py-1 rounded text-[10px] font-mono uppercase bg-blue-600 text-white"
                : "px-2 py-1 rounded text-[10px] font-mono uppercase bg-zinc-900 border border-white/10 text-zinc-400 hover:text-zinc-200"
            }
          >
            By Source
          </button>
        </div>
      </div>
      <div className="h-[250px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
            <PolarGrid stroke="#3f3f46" />
            <PolarAngleAxis dataKey="subject" tick={{ fill: "#a1a1aa", fontSize: 10 }} />
            <Radar name="Fragility" dataKey="fragility" stroke="#ef4444" fill="#ef4444" fillOpacity={0.3} />
          </RadarChart>
        </ResponsiveContainer>
      </div>
      <p className="text-[11px] text-zinc-400 mt-2">
        {mode === "domain" ? "Domain fragility view." : "Volatility source fragility view."}
      </p>
    </div>
  );
};
