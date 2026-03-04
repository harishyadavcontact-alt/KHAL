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
- `/lab`
- `/interests`
- `/affairs`
- `/war-gaming` (landing redirects to `/war-gaming/affair`)
- `/war-gaming/source`
- `/war-gaming/domain`
- `/war-gaming/affair`
- `/war-gaming/interest`
- `/war-gaming/craft`
- `/war-gaming/lineage`
- `/war-gaming/mission`
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
npm --workspace @khal/web run perf:smoke
node scripts/qa-report.mjs
```

## Quality Gate (v0.4.3-RC)
- CI is npm-only and deterministic (`npm ci`).
- Required checks are split into: `verify`, `build`, `smoke`, `security-audit`.
- Local single-command reliability gate:
  - `npm run quality:gate`
- CI workflow hygiene audit:
  - `npm run ci:audit`
- Cross-platform smoke and perf outputs are written to:
  - `artifacts/quality/smoke-routes.json`
  - `artifacts/quality/perf-smoke.json`
  - `artifacts/quality/qa-summary.json`
- UAT checklist and evidence templates:
  - `docs/uat/v0.4.3-uat-checklist.md`
  - `docs/uat/v0.4.3-uat-evidence-template.md`
- CI gate contract:
  - `docs/release/ci-gate-contract.md`
- Main-branch release packaging sequence:
  - `npm run release:package:main`

## Fractal War Gaming (v0.4.2)
- Modes are first-class and mode-specific: `source`, `domain`, `affair`, `interest`, `craft`, `lineage`, `mission`.
- Hybrid role flow:
  - `Missionary`: stricter dependency-first posture, risky actions blocked when predecessor grammar is missing.
  - `Visionary`: free mode jumps with deterministic dependency warnings.
- Canonical decision tree artifact:
  - `docs/decision-tree/war-room-fractal-decision-tree.md`

## References
- Web implementation notes: `apps/web/README.md`
- Decision compatibility spec: `docs/reports/khal-decision-compatibility-test-cases.md`
