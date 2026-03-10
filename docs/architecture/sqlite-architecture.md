# KHAL SQLite Architecture (v0.2 Pivot)

## Canonical Data Model
- **Product template DB**: `data/KHAL.sqlite`
- **Active runtime DB**: selected operator database, typically `data/operators/<operator-slug>.sqlite`
- **Runtime mode**: local-first, offline-capable, deterministic API reads/writes
- **Historical artifacts**: `Genesis.xlsx` retained for reference only (not active authority)

## War Room Translation
War Room has narrative hierarchy. It maps to:

1. `war_room_sections`
- one row per top section (`state_of_the_art`, `state_of_affairs`, etc.)

2. `war_room_nodes`
- tree nodes under each section
- supports headings, bullets, key/value, free text

`node_type` values:
- `heading`
- `bullet`
- `kv`
- `text`

Hierarchy:
- `parent_node_id` gives unlimited depth
- `sort_order` preserves narrative sequence

## Strategic/Execution Translation
- `domains` -> strategic domains
- `ends` -> outcomes per domain
- `means` -> methods/techniques/tools per end
- `fragilities` -> vulnerabilities and risk/stakes
- `affairs` -> obligations curing fragility
- `interests` -> optionality bets
- `portfolio_projects` -> portfolio command layer above bets
- `portfolio_ship_logs` / `portfolio_experiments` / `portfolio_evidence` / `portfolio_decision_gates` -> operating signal for each bet
- `plans` + `metrics` -> war-gaming layer
- `tasks` + `task_dependencies` -> surgical execution chain
- `mission_nodes` + `mission_dependencies` -> mission command hierarchy graph

## Performance Rationale
- Frequent UI queries become indexed SQL reads
- No repeated workbook parse/write loop
- Offline and local by default
- Single-file DB keeps portability and ownership

## File/Schema Assets
- DB bootstrap script: `scripts/bootstrap-sqlite.ts`
- Schema migration: `packages/sqlite-core/migrations/0001_init.sql`
- Runtime adapter entry: `packages/sqlite-core/src/index.ts`
- Operator DB resolution: `apps/web/lib/operator-db.ts`
