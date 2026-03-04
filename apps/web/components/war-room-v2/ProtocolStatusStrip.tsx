import type { DecisionAccelerationMeta } from "./types";

const BADGE_CLASSES: Record<DecisionAccelerationMeta["protocolState"], string> = {
  NOMINAL: "text-emerald-300 border-emerald-500/40 bg-emerald-500/10",
  WATCH: "text-amber-300 border-amber-500/40 bg-amber-500/10",
  CRITICAL: "text-red-300 border-red-500/40 bg-red-500/10"
};

export function ProtocolStatusStrip({ meta }: { meta?: DecisionAccelerationMeta }) {
  if (!meta) return null;

  const topInvariant = meta.invariantViolations[0];
  const label = meta.fallbackUsed ? "Degraded but operable" : "Telemetry nominal";
  const computed = new Date(meta.computedAtIso);
  const computedText = Number.isNaN(computed.getTime()) ? "Unknown time" : computed.toLocaleString();

  return (
    <section className="glass p-3 rounded-xl border border-white/10 mb-4">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest">
          <span className={`px-2 py-1 rounded-md border font-semibold ${BADGE_CLASSES[meta.protocolState]}`}>
            {meta.protocolState}
          </span>
          <span className="text-zinc-400">Data {meta.dataQuality}</span>
          <span className={meta.fallbackUsed ? "text-amber-300" : "text-emerald-300"}>{label}</span>
        </div>
        <div className="text-[10px] uppercase tracking-widest text-zinc-500">
          Computed {computedText}
        </div>
      </div>
      {topInvariant && (
        <div className="mt-2 text-xs rounded-md border border-red-500/30 bg-red-500/10 px-2 py-1 text-red-200">
          Invariant: {topInvariant}
        </div>
      )}
    </section>
  );
}
