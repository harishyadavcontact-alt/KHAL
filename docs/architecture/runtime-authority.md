# KHAL Runtime Authority

SQLite at `data/KHAL.sqlite` is the only runtime authority.

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
