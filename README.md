# KHAL

Status: downstream

## First Read
- Start with `KHAL_genesis.md`.
- Then read `docs/product/Khal_genesis.md`.
- Treat `KHAL_genesis.md` as the repo-root entrypoint and `docs/product/Khal_genesis.md` as the full doctrine source of truth for product doctrine, ontology, surface purpose, and operating sequence.
- If any downstream doc, report, note, or implementation detail conflicts with `docs/product/Khal_genesis.md`, `docs/product/Khal_genesis.md` wins.
- Use this `README.md` only as a repository entrypoint and implementation map.

## Development Model

KHAL follows a genesis-first, bottom-up development model:

- global doctrine is anchored in `docs/product/Khal_genesis.md`
- `KHAL_genesis.md` is the repo-root agent entrypoint
- implementation should resolve ambiguity as locally as possible

KHAL is a local-first decision operating system.

At its simplest:

- `War Room` helps the user think clearly about one domain.
- `Mission Command` aggregates `Affairs` into hierarchy.
- `Vision Command` aggregates `Interests` into hierarchy.

Surface model:

- `War Room` = see the decision
- `War Gaming` = game the decision
- `Mission Command` = organize affairs
- `Vision Command` = organize interests
- `Dashboard` = global system telemetry

The core thinking loop inside KHAL is:

- `State of the Art`
  - `Skin in the Game`
  - `Philosopher's Stone`
  - `Ends`
  - `Means`
- `State of Affairs`
  - `Affairs`
  - `Interests`

Doctrine:

- `Affairs` are obligations that remove fragility.
- `Interests` are options that preserve or create convexity.
- Decision clarity should be available in under one second.

UI / UX principles:

- `Form follows function`
- `Show, don't tell`
- `The medium is the message`

## Source of Truth
- **Project doctrine source of truth**: `docs/product/Khal_genesis.md`.
- **Repo root entrypoint**: `KHAL_genesis.md`.
- **Runtime data authority**: SQLite-first runtime, with `data/KHAL.sqlite` as template DB and `data/operators/*.sqlite` as active operator DBs when selected.
- `docs/root-docs/Genesis.xlsx` is retained as historical/reference material only and should not be opened unless explicitly requested.
- No active Excel sync or Excel-authority path is required for runtime behavior.

## Repo Reading Order
1. `docs/product/Khal_genesis.md`
2. `KHAL_genesis.md`
3. `AGENTS.md`
4. `README.md`
5. `docs/architecture/*` as needed for implementation reality
6. `docs/product/*` only for local surface contracts
7. `docs/reports/*` as historical analysis, never as doctrine authority

## Repository Structure
- `apps/web`: Next.js UI + API routes.
- `packages/domain`: scoring and domain primitives.
- `packages/sqlite-core`: schema/migrations/bootstrap.
- `packages/sync-engine`: state orchestration + writes.
- `packages/ui`: shared UI package.
- `scripts`: smoke checks, db bootstrapping, exports.
- `docs`: architecture, product decisions, reports.
- `docs/root-docs`: historical root-level docs retained outside the repo root.

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
- `/war-gaming` (landing redirects to `/war-gaming/source`)
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
- `/drafts`
- `/missionCommand/portfolio`
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

## Decision Triage + Doctrine Controls (v0.4.5-R1)
- Deterministic triage API:
  - `POST /api/decision/triage`
- Whitelisted quick-fix API:
  - `POST /api/decision/quick-action`
- UI surfaces:
  - War Gaming `TriageActionPanel` + `DoctrineFixButtons`
  - Dashboard `NextActionStrip`

## References
- Web implementation notes: `apps/web/README.md`
- Decision compatibility spec: `docs/reports/khal-decision-compatibility-test-cases.md`
- All other docs are downstream, operational, or generated artifacts and must not redefine product doctrine.
