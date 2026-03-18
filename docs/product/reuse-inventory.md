# Reuse Inventory

Purpose:
- keep strong UI, visual, and interaction artifacts that are worth preserving during the rewrite
- separate "worth keeping" from "currently misplaced"
- give future surface rewrites a small inventory of reusable parts

Rules:
- record only high-signal pieces
- note why they matter
- note where they likely belong
- update this file when a simplification pass removes or relocates a good artifact

Current keepers:

## Visual artifacts

- `Fragility radar / spider web`
  - why: fast "show, don't tell" read on where brittleness is accumulating
  - likely home: `Dashboard` as global view, scoped versions in `War Gaming / Domain`
  - notes: user explicitly called this one of the strongest artifacts

- `Source volatility flow`
  - why: shows pressure propagation better than narrative copy
  - likely home: `Dashboard` as global artifact, scoped use in `War Gaming / Source`

- `Quadrant heat grid`
  - why: strong compressed read of regime/risk field classification
  - likely home: `Dashboard` globally, optional scoped use in `War Gaming / Source` or `Domain`

- `Task kill chain`
  - why: execution path is clearer visually than status prose
  - likely home: local execution sections, especially `War Gaming / Domain` and later `Mission Command`

## Surface ideas worth preserving

- `Lineage as a lens`
  - why: stronger than lineage as a static report block
  - likely home: top-level selector in local chambers, especially `War Gaming / Domain`

- `State of the Art -> State of Affairs`
  - why: this is the cleanest operator-facing decision grammar found so far
  - likely home: `War Room` and local War Gaming chambers

- `War Room / War Gaming / Mission / Vision / Dashboard` split
  - why: clean separation of present state, simulation, obligation hierarchy, option hierarchy, and telemetry
  - likely home: canonical product model and navigation

## Code/data bridges worth preserving

- `StateOfArtProjection`
  - file: `apps/web/lib/war-room/state-of-art.ts`
  - why: converts source-map/runtime data into operator-facing doctrine structure
  - likely use: shared backend/domain adapter for `War Room`, `War Gaming / Source`, `War Gaming / Domain`, `Affair`, and `Interest`

- `SourceWarGameProtocol`
  - file: `apps/web/lib/war-room/state-of-art.ts`
  - why: captures source-side planning semantics outside the UI
  - likely use: base model for rebuilding `War Gaming / Source`

- `Genesis`
  - files:
    - `docs/product/Khal_genesis.md`
    - `docs/knowledge/genesis.json`
    - `docs/decision-tree/genesis.mmd`
  - why: `docs/product/Khal_genesis.md` is the canonical doctrine source; the derived Genesis artifacts are useful structure maps while simplifying the UI
  - likely use: reference while simplifying UI so semantics are not lost
