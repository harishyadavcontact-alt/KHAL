# KHAL

KHAL is a local-first decision operating system for uncertainty. It is built around a volatility-first doctrine:

- `Affairs` are obligations that remove fragility (hedge lane).
- `Interests` are options that increase convexity (edge lane).
- `Mission Command` organizes execution hierarchy.
- Decision clarity should be available in under one second.

## Runtime Authority
- **Single runtime and strategic authority**: SQLite (`data/KHAL.sqlite`).
- `Genesis.xlsx` is retained in the repo as historical/reference material only.
- No active Excel sync or Excel-authority path is required for runtime behavior.

## Repository Structure
- `apps/web`: Next.js UI + API routes.
- `packages/domain`: scoring and domain primitives.
- `packages/sqlite-core`: schema/migrations/bootstrap.
- `packages/sync-engine`: state orchestration + writes.
- `packages/ui`: shared UI package.
- `scripts`: smoke checks, db bootstrapping, exports.
- `docs`: architecture, product decisions, reports.

## Quickstart
```bash
npm install
npm run db:init
npm --workspace @khal/web run dev
```

## Canonical UI Surface
- `/home`
- `/dashboard`
- `/war-room`
- `/missionCommand`
- `/source-of-volatility`
- `/interests`
- `/affairs`
- `/war-gaming` (landing redirects to `/war-gaming/affair`)
- `/surgical-execution`
- `/crafts-library`
- `/time-horizon`
- `/lineage-map`
- `/maya`
- `/brand`
- `/khal/logo`
- `/khal/wordmark`

## Compatibility Redirects
- `/mission-command` -> `/missionCommand`
- `/laws` -> `/source-of-volatility`
- `/crafts` -> `/crafts-library`
- `/lineages` -> `/lineage-map`
- `/settings` -> `/missionCommand`

## Validation
```bash
npm run typecheck
npm run build
npm --workspace @khal/web run test
npm --workspace @khal/web run smoke:routes
```

## References
- Web implementation notes: `apps/web/README.md`
- Decision compatibility spec: `docs/reports/khal-decision-compatibility-test-cases.md`
