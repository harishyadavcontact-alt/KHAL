# KHAL

KHAL is a local-first decision operating system for War Room ontology, mission sequencing, war-gaming, and surgical execution.

## Core Principles
- Single runtime authority: SQLite (`data/KHAL.sqlite`)
- War Room ontology is authoritative
- Affairs = obligations (hedge / fragility removal)
- Interests = optionality (edge / convex upside)
- Decision clarity first; polish second

## Repository Structure
- `apps/web`: Next.js app UI + API routes
- `packages/domain`: core domain logic and scoring
- `packages/sqlite-core`: schema and DB bootstrap/migrations
- `packages/sync-engine`: state orchestration and writes
- `packages/excel-io`: Excel interoperability adapters
- `packages/ui`: shared UI package
- `scripts`: operational utilities (port preflight, smoke checks, parity reporting)
- `docs/reports`: build reports, parity logs, compatibility specs

## Quickstart
```bash
npm install
npm run db:init
npm --workspace @khal/web run dev
```

## Canonical Runtime
- Web port: `3010`
- `@khal/web` preflight clears stale listeners on `3010` for `dev` and `start`.

## Canonical UI Surface
- `/home`
- `/dashboard`
- `/war-room`
- `/missionCommand`
- `/source-of-volatility`
- `/interests`
- `/affairs`
- `/war-gaming` (landing -> `/war-gaming/affair`)
- `/surgical-execution`
- `/crafts-library`
- `/time-horizon`
- `/lineage-map`
- `/brand`
- `/khal/logo`
- `/khal/wordmark`

## Compatibility Routes (intentional redirects)
- `/mission-command` -> `/missionCommand`
- `/laws` -> `/source-of-volatility`
- `/crafts` -> `/crafts-library`
- `/lineages` -> `/lineage-map`
- `/settings` -> `/missionCommand`

## Validation Commands
```bash
npm test
npm run typecheck
npm run build
npm --workspace @khal/web run smoke:routes
npm --workspace @khal/web run test:decision-compat
```

## 404 Recovery (route exists in code but returns 404)
```bash
npm --workspace @khal/web run build
npm --workspace @khal/web run start
npm --workspace @khal/web run smoke:routes
```

## Database and Schema
- Default DB: `data/KHAL.sqlite`
- Base migration: `packages/sqlite-core/migrations/0001_init.sql`

## Additional References
- Web app implementation notes: `apps/web/README.md`
- Decision compatibility spec: `docs/reports/khal-decision-compatibility-test-cases.md`
