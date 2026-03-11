# Agent Scratchpad

Purpose:
- keep a compact working pointer for the current rewrite seam
- reduce re-discovery when moving between implementation slices
- point back to canonical continuity files instead of duplicating them

Read first:
- `TERMINAL_HANDOFF.md`
- `docs/agent-log/README.md`
- `docs/agent-log/2026-03.md`

Current product spine:
- Runtime authority: operator-scoped SQLite
- Doctrine order:
  - `State of the Art`
    - `Map`
    - `Philosopher's Stone`
    - `Ends`
    - `Means`
  - `State of Affairs`
    - `Affairs`
    - `Interests`
  - `Mission`

Current rewrite focus:
- make source-mode War Gaming consume extracted `scenario -> threat -> response` doctrine
- keep `main` shippable through small, verified slices
- preserve strong existing UI surfaces and replace fake/manual behavior with real runtime piping

Current status:
- source-mode now renders scenario / threat / response guidance from `responseLogic`
- doctrine chains are narrowed by selected craft when available, otherwise fall back to a small global set
- source-mode triage/readiness now checks whether the selected craft is backed by a doctrine chain with scenarios, threats, and responses
- source-mode quick actions now open craft playbooks for missing doctrine chain / scenario / threat / response seams
- generated Affairs / Interests now carry doctrine warnings forward when the selected craft is under-specified
- Mission Command now has a dedicated bootstrap route instead of depending on the generic war-room payload
- Mission guidance now preserves source-domain provenance instead of flattening doctrine weakness to one domain-level penalty
- Mission and Mission Command now surface source-domain doctrine cautions on linked Affairs / Interests without introducing coarse ranking penalties
- intentionally deferred: `Vision Command` and doctrine-penalized Mission ordering until they can respect source-domain granularity

Key implementation files:
- `apps/web/lib/api/wargaming-doctrine.ts`
- `apps/web/lib/war-room/bootstrap.ts`
- `apps/web/components/war-room-v2/WarGaming.tsx`
- `apps/web/components/war-room-v2/wargame_volatility.tsx`
- `apps/web/lib/api/source-map.ts`
- `apps/web/lib/war-room/mission-guidance.ts`

Key planning docs:
- `docs/architecture/war-gaming-rewrite-slice-2026-03-11.md`
- `docs/repository-workstreams.md`
- `docs/reports/state-of-the-art-alignment-2026-03-10.md`

Rule for this file:
- keep it short
- use it as a pointer map, not a parallel handoff log
- update pointers when the primary rewrite seam changes materially
