KHAL terminal handoff

- Repo: E:\KHAL
- Branch: main
- Runtime authority: operator-scoped SQLite via data/operators/*.sqlite selected through .khal.local.json
- Excel: Genesis.xlsx is archival only

Recent completed work:

- Portfolio War Room added under Mission Command
- Drafts rebuilt as prose-first with structural anchors and SQLite persistence
- Runtime authority and invariant reporting hardened
- Doctrine language shifted from confidence toward signal in newer surfaces
- Section and war-gaming mode registries are in progress
- Operator onboarding now targets per-user SQLite runtimes and source-first War Gaming
- War Gaming bootstrap has been split off the generic war-room payload
- Scenario/threat/response doctrine chains now load through a dedicated War Gaming API module
- Source-mode Map is now implemented as canonical SQLite data on source-domain pairs
- Source-mode War Gaming derives quadrant and admissible means posture from decision type and tail class
- Source-mode now persists Map, Philosopher's Stone, Ends, and Means together on the canonical source-domain profile
- War Gaming flow grammar now reflects:
  - State of the Art
  - State of Affairs
  - Mission
- Source-mode UI is internally staged into:
  - Map
  - Stone
  - Ends
  - Means
- Source-domain profiles can now generate linked State of Affairs records:
  - `Affair <- hedge`
  - `Interest <- edge`
  with canonical links stored on the source-domain profile
- War Gaming `Affair` / `Interest` modes now act as planning lenses with inherited State of the Art context and links out to operational `Affairs` / `Interests` / `Lab` surfaces
- desktop ops nav is now collapsible without changing the theme system
- operational `Affairs` and `Lab` surfaces now consume inherited source-domain doctrine directly:
  - `Affair` prep can be seeded from `hedge` / fragility / risk context
  - `Lab` can prefill hypothesis / evidence / downside from generated Interest doctrine
- top-level `Interests` now exposes inherited doctrine and can open Portfolio creation with generated-interest context
- Portfolio creation now understands linked Interests well enough to prefill a real project draft from doctrine fields
- source-mode War Gaming now consumes extracted `scenario -> threat -> response` doctrine as step-aware guidance instead of leaving it dormant in bootstrap

Current known fragilities:

- War Room still has a mock/runtime split in apps/web/app/api/war-room-data/route.ts and apps/web/lib/war-room/useWarRoomData.ts
- War Gaming internals still contain legacy confidence naming in some types/metrics code
- War Gaming UI does not yet consume the extracted responseLogic doctrine chain
- State of the Art "Map -> Stone -> Ends -> Means" flow is now persisted and staged in source-mode, but downstream doctrine/triage surfaces still only partially exploit it
- source-mode now displays doctrine chains, but triage/readiness still does not reason over them deeply
- State of Affairs inheritance now exists, but affair/interest screens are still too thin functionally compared to the richer source-mode doctrine data
- Portfolio now consumes generated Interests at creation time, but deeper downstream exploitation of linked interest doctrine is still limited
- Some docs trail the current implementation and need a truth-pass

Strong next move:

- Prepare War Gaming rewrite by extracting seams first:
  - use the extracted scenario/threat/response contract inside scoring, triage, and recommended next actions after the new source-mode guidance pass
  - continue State of the Art implementation after Map:
    - use the new Stone / Ends / Means fields in doctrine scoring and source guidance
  - make State of Affairs inherit hedge / edge / craft / fragility data from State of the Art more explicitly
  - deepen Portfolio project detail and experiment/gate surfaces so linked-interest doctrine remains visible beyond creation time
  - continue reducing dependency on generic mock war-room data
  - clean remaining operator-facing confidence language
  - keep app-shell/theme work stable while feature work continues

Session log:

- Read first: docs/agent-log/README.md
- Latest monthly log: docs/agent-log/2026-03.md

Recommended opening prompt for the new Codex terminal:

Continue in E:\KHAL from current main. Read TERMINAL_HANDOFF.md and docs/agent-log/2026-03.md, inspect the current repo state, and continue the War Gaming rewrite by implementing the next State of the Art stages after Map: Philosopher's Stone, Ends, and Means, on top of the extracted source-map and responseLogic seams.
