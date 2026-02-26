<<<<<<< HEAD
# KHAL
=======
# Khal v0.1 Monorepo

Khal is a narrative-first decision operating system using `Genesis.xlsx` as canonical data.

## Stack
- pnpm workspaces + Turborepo
- Next.js web app (`apps/web`)
- Shared packages for domain, excel I/O, sync engine, and UI

## Quickstart
```bash
pnpm install
pnpm verify:workbook
pnpm bootstrap:workbook
pnpm dev
```

## Core Routes
- `/dashboard`
- `/war-room`
- `/war-gaming`
- `/surgical-execution`
- `/mission-command`
- `/affairs`
- `/interests`
- `/settings`

## API
- `GET /api/state`
- `POST/PATCH /api/affairs`
- `POST/PATCH /api/interests`
- `POST/PATCH /api/tasks`
- `POST /api/wargaming/:endId/generateTasks`
- `POST /api/sync/refresh`
- `POST /api/workbook/normalize`
- `GET/POST /api/workbook/validate`
>>>>>>> e4ff21c (bootstrap khal v0.1 monorepo with npm workflow)
