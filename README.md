# KHAL

KHAL is a local-first decision operating system.

## Runtime Direction
- **Source of truth**: `data/KHAL.sqlite`
- **UI**: Next.js app (`apps/web`)
- **Excel**: optional import/export interoperability (not runtime authority)

## Monorepo
- `apps/web`: UI + API routes
- `packages/domain`: domain model + scoring logic
- `packages/sqlite-core`: SQLite schema + bootstrap
- `packages/excel-io`: legacy/interoperability adapters
- `packages/sync-engine`: orchestration logic
- `packages/ui`: shared React components

## Quickstart
```bash
npm install
npm run db:init
npm --workspace @khal/web run dev
```

## Validation
```bash
npm test
npm run typecheck
npm run build
```

## Database
- Default DB file: `data/KHAL.sqlite`
- Schema migration: `packages/sqlite-core/migrations/0001_init.sql`

## Notes
- Local-first and offline operation are first-class.
- SQLite keeps user data portable and owned.
- Excel support remains possible as import/export surface.