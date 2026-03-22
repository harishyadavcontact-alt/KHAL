# KHAL Runtime Authority

Status: downstream

Derived from `docs/product/Khal_genesis.md`.

KHAL is SQLite-first, and the active runtime is operator-scoped.

- Product template DB: `data/KHAL.sqlite`
- Active operator DBs: `data/operators/*.sqlite`
- Local runtime selection override: `.khal.local.json`

For a single local operator, the app should read/write the selected operator DB, not the template DB.

## Ownership

| Entity area | Authoritative writes | Runtime reads |
| --- | --- | --- |
| Laws / domains | `apps/web/lib/api.ts` + SQLite tables | Canonical SQL reads |
| Affairs / interests / tasks | `@khal/sync-engine` write helpers backed by SQLite | SQLite projection via `loadRuntimeProjection(...)` |
| Portfolio War Room | `apps/web/lib/portfolio/store.ts` | Canonical SQL reads |
| Drafts / anchors / promotions | `apps/web/lib/drafts/store.ts` | Canonical SQL reads |
| Knowledge primitives | `apps/web/lib/api.ts` and Draft promotion flow | Canonical SQL reads |
| Lineage / doctrine / plans | `apps/web/lib/api.ts` and `apps/web/lib/api/*.ts` | Canonical SQL reads |

## Projection Rule

`loadState(dbPath)` is allowed only as a SQLite-backed projection. It is not a second source of truth.

App routes should consume the projection through `apps/web/lib/runtime/authority.ts`, which attaches:

- runtime invariant report
- ownership metadata
- consistent SQLite-backed state projection

## Invariants

Runtime invariants are exposed internally at `/api/invariants`.

The report returns:

- `generatedAt`
- `hardViolations`
- `softViolations`
- `summary`

Hard violations represent broken parent chains that should not exist. Soft violations represent structural weakness that the current schema can detect without inventing unsupported maturity.

Portfolio-specific soft checks include:

- active project without an experiment loop
- core or stalled project without an open gate
- active project without a declared bottleneck
- archived or killed project without a retained lesson
