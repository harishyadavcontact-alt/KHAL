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

## Local Runtime (Canonical)
- Canonical web port: `3010`
- Canonical UI surface:
  - `/war-room`
  - `/war-gaming`
  - `/missionCommand`
  - `/brand`
  - `/khal/logo`
  - `/khal/wordmark`
  - `/home`
  - `/dashboard`
- `@khal/web` preflight automatically clears stale process on `3010` before `dev` and `start`.

### 404 Recovery (When Code Exists but Route Fails)
If a route exists in code but returns `404`, run a fresh server cycle:

```bash
npm --workspace @khal/web run build
npm --workspace @khal/web run start
```

Then run route smoke:

```bash
npm --workspace @khal/web run smoke:routes
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
