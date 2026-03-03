# @khal/web

Next.js application layer for KHAL.

## Purpose
- Render operational surfaces (Home, Dashboard, War Room, Mission Command, etc.)
- Provide local API routes backed by `@khal/sync-engine` and SQLite
- Keep route behavior and visual flow consistent with KHAL ontology

## Run
```bash
npm --workspace @khal/web run dev
```

The app is pinned to port `3010`. Preflight scripts clear stale listeners before `dev` and `start`.

## Frontend-only Mode (temporary)
To bypass backend API calls and use local mock data while building UI features:

```bash
$env:NEXT_PUBLIC_FRONTEND_ONLY="1"; npm --workspace @khal/web run dev
```

## Canonical Routes
- `/home`
- `/dashboard`
- `/war-room`
- `/missionCommand`
- `/source-of-volatility`
- `/interests`
- `/affairs`
- `/war-gaming` and `/war-gaming/[mode]`
- `/surgical-execution`
- `/crafts-library`
- `/time-horizon`
- `/lineage-map`
- `/brand`
- `/khal/logo`
- `/khal/wordmark`

## Compatibility Redirect Routes
- `/mission-command` -> `/missionCommand`
- `/laws` -> `/source-of-volatility`
- `/crafts` -> `/crafts-library`
- `/lineages` -> `/lineage-map`
- `/settings` -> `/missionCommand`

## Tests
- Full app tests:
```bash
npm --workspace @khal/web run test
```
- Decision-logic compatibility suite:
```bash
npm --workspace @khal/web run test:decision-compat
```

## Key Internal Areas
- `app/`: route entry points
- `components/ops-shell/`: shared ops shell + canonical nav
- `components/war-room-v2/`: domain views and operational components
- `lib/api.ts`: API handlers + app data shaping
- `lib/war-room/`: actions, route parsing, data hook
- `test/`: vitest suites

## Clean-Code Notes
- Keep compatibility pages as redirect-only files.
- Add new UI surfaces only when they map to ontology/layer changes.
- Avoid introducing generated build artifacts into git-tracked files.
