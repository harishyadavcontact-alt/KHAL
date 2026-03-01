# KHAL SQLite Architecture (v0.2 Pivot)

## Canonical Data Model
- **Canonical ontology authority**: Excel workbook (schema and doctrine structure)
- **Operational runtime store**: `data/KHAL.sqlite` (local projection/cache for performance and offline execution)
- **Interop formats**: Excel, CSV, JSON (import/export)
- **UI writes/reads**: SQLite runtime, then synchronized/mapped back to canonical Excel structure

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

## Excel/SQLite Sync Strategy
1. Bootstrap DB schema (projection)
2. Import canonical workbook (`Genesis.xlsx`) into SQLite projection
3. Run APIs/UI on SQLite runtime for speed
4. Export/sync changes through explicit mapping layer to preserve Excel authority
5. Never redesign Excel schema silently
