import type { VirtueSpiralState } from "./types";

const STAGE_LABELS: Record<VirtueSpiralState["stage"], string> = {
  REDUCE_FRAGILITY: "Reduce Fragility",
  SECURE_SURVIVAL: "Secure Survival",
  ASYMMETRIC_BETS: "Asymmetric Bets",
  GAIN_RESOURCES: "Gain Resources",
  DOMINANCE: "Dominance"
};

const STAGE_ORDER: VirtueSpiralState["stage"][] = [
  "REDUCE_FRAGILITY",
  "SECURE_SURVIVAL",
  "ASYMMETRIC_BETS",
  "GAIN_RESOURCES",
  "DOMINANCE"
];

const TREND_ARROW: Record<VirtueSpiralState["trend"], string> = {
  UP: "UP",
  STABLE: "HOLD",
  DOWN: "DOWN"
};

export function VirtueSpiralPanel({ spiral }: { spiral: VirtueSpiralState }) {
  const stageIndex = STAGE_ORDER.indexOf(spiral.stage);
  return (
    <section className="glass p-4 rounded-xl border border-cyan-500/20">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <div className="text-[10px] uppercase tracking-widest text-cyan-300/80">Virtue Spiral</div>
          <h3 className="text-sm font-bold text-cyan-100">{STAGE_LABELS[spiral.stage]}</h3>
        </div>
        <div className="text-right">
          <div className="text-xs uppercase tracking-widest text-zinc-500">Trend</div>
          <div
            className={
              spiral.trend === "UP"
                ? "text-emerald-300 font-bold"
                : spiral.trend === "DOWN"
                  ? "text-red-300 font-bold"
                  : "text-amber-200 font-bold"
            }
          >
            {TREND_ARROW[spiral.trend]}
          </div>
        </div>
      </div>

      <div className="relative mb-3">
        <div className="h-24 rounded-xl border border-white/10 bg-zinc-950/60 overflow-hidden">
          <svg viewBox="0 0 320 110" className="w-full h-full">
            <defs>
              <linearGradient id="spiralLine" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#0ea5e9" />
                <stop offset="100%" stopColor="#22d3ee" />
              </linearGradient>
            </defs>
            <path d="M15,95 C70,88 85,15 145,20 C200,24 215,84 285,15" fill="none" stroke="url(#spiralLine)" strokeWidth="4" strokeLinecap="round" />
            <path d="M285,15 L276,18 L279,8 Z" fill="#22d3ee" />
          </svg>
        </div>
        <div className="absolute inset-x-3 bottom-2 flex justify-between text-[10px] text-zinc-400 uppercase tracking-widest">
          <span>Mortal</span>
          <span>Free Man</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="rounded-lg border border-white/10 bg-zinc-900/60 px-2 py-1.5">
          <div className="text-[10px] uppercase text-zinc-500">Score</div>
          <div className="text-sm font-semibold text-cyan-200">{spiral.score}</div>
        </div>
        <div className="rounded-lg border border-white/10 bg-zinc-900/60 px-2 py-1.5">
          <div className="text-[10px] uppercase text-zinc-500">Fragility</div>
          <div className="text-sm font-semibold text-red-200">{spiral.openFragilityMass}</div>
        </div>
        <div className="rounded-lg border border-white/10 bg-zinc-900/60 px-2 py-1.5">
          <div className="text-[10px] uppercase text-zinc-500">Convexity</div>
          <div className="text-sm font-semibold text-emerald-200">{spiral.convexityMass}</div>
        </div>
      </div>

      <div className="text-xs text-zinc-300 border border-white/10 rounded-lg bg-zinc-900/50 px-3 py-2">
        {spiral.nextAction}
      </div>

      <div className="mt-2 text-[10px] uppercase tracking-widest text-zinc-500">
        Stage {stageIndex + 1}/{STAGE_ORDER.length} | execution velocity {spiral.executionVelocity}
      </div>
    </section>
  );
}

