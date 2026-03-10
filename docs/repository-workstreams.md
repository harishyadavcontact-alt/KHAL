# Repository Workstreams

This document converts the current KHAL repository into concrete engineering sections so work can proceed systematically.

## 1. System Core

Purpose:
- keep SQLite as the only persistence authority, with `data/KHAL.sqlite` as template and `data/operators/*.sqlite` as live operator runtimes
- preserve the ontology: Affairs reduce fragility, Interests increase convexity, Mission Command sequences action

Primary files:
- `packages/sqlite-core/`
- `packages/domain/`
- `packages/sync-engine/`
- `scripts/bootstrap-sqlite.ts`
- `docs/architecture/`

Current state:
- authority policy is now template-plus-operator rather than one shared live file
- schema is migration-driven and SQLite bootstrapping is in place
- sync engine is the main read/write projection layer

Observed risk:
- `packages/sync-engine/src/index.ts` is a large monolith at roughly 1,767 lines
- decision metrics, SQL mapping, invariants, and write flows are tightly coupled in one file
- this will slow down changes and make regressions harder to isolate

Recommended work:
- split sync-engine into read-model loaders, dashboard metrics, invariant checks, and write commands
- document the exact ownership boundary between `apps/web/lib/api.ts` and `@khal/sync-engine`
- add contract tests for the highest-risk computed dashboard blocks

## 2. Web Application Surfaces

Purpose:
- expose the operational cockpit in under one second
- keep canonical routes and compatibility redirects stable

Primary files:
- `apps/web/app/`
- `apps/web/components/ops-shell/`
- `apps/web/components/war-room-v2/`
- `apps/web/components/ops-pages/`
- `apps/web/lib/war-room/`

Current state:
- route coverage is broad and maps well to the product doctrine
- the app includes canonical surfaces for dashboard, war room, mission command, war gaming, affairs, interests, and surgical execution
- portfolio and draft-related surfaces are already present

Observed risk:
- there is a large amount of route and component surface area relative to the compact size of the core packages
- route breadth increases the chance of UI drift from the runtime contract
- some product/version references already span `v0.4.3`, `v0.4.4`, `v0.4.5-R1`, and `v0.5 planning`

Recommended work:
- verify every canonical page against one current product contract
- remove dead compatibility logic only after route tests prove parity
- identify which surfaces are stable, experimental, or planning-only

## 3. API Contract and Runtime Conformance

Purpose:
- make local API behavior deterministic
- ensure each UI surface is reading from the intended SQLite-backed projection

Primary files:
- `apps/web/app/api/`
- `apps/web/lib/api.ts`
- `apps/web/lib/api/*.ts`
- `apps/web/lib/runtime/`
- `docs/architecture/api-contract.md`

Current state:
- API contract is documented
- mutation and projection routes exist for core entities, portfolio, drafts, doctrine, time horizon, lineage, and decision triage

Observed risk:
- `apps/web/lib/api.ts` is also large at roughly 1,689 lines
- contract breadth is high, but contract ownership is split across many files and release eras
- versioned docs suggest additive growth faster than consolidation

Recommended work:
- create a route-by-route conformance matrix from docs to implementation
- identify routes that are canonical, legacy, or additive experiments
- ensure every route uses the runtime authority helper path consistently

## 4. Product Doctrine and Decision Logic

Purpose:
- keep the Taleb-style doctrine legible in code rather than only in prose
- ensure blocked states and next actions remain deterministic

Primary files:
- `docs/product/`
- `docs/decision-tree/`
- `apps/web/components/war-room-v2/panels/`
- `apps/web/lib/decision-spec/`
- `apps/web/lib/api/doctrine.ts`

Current state:
- doctrine is documented with clear constraints around triage, quick actions, and no-ruin controls
- there is explicit test coverage for decision compatibility and war-gaming doctrine

Observed risk:
- doctrine now exists across docs, dashboard metrics, quick actions, and war-gaming flows
- without a single executable source for doctrine rules, drift becomes likely

Recommended work:
- centralize doctrine rule evaluation and keep UI layers display-only where possible
- map every doctrine promise in docs to either code or tests
- identify any prose-only doctrine that still lacks enforcement

## 5. Quality, Release, and Operational Reliability

Purpose:
- keep the project deterministic to build, test, and release

Primary files:
- `.github/workflows/`
- `scripts/quality-gate.ps1`
- `scripts/smoke-routes.mjs`
- `scripts/perf-smoke.mjs`
- `scripts/qa-report.mjs`
- `docs/release/`
- `docs/security/`
- `docs/performance/`
- `docs/uat/`

Current state:
- quality and release hardening is documented and wired into scripts
- smoke, perf, QA summary, release packaging, and workflow audit scripts already exist

Observed risk:
- documentation suggests strong release discipline, but current repository exploration has not yet validated the full gate on this checkout
- version naming across docs should be normalized so release state is obvious

Recommended work:
- run the current quality gate and record failures by layer
- align changelog, NEXT_STEPS, release docs, and current implementation version
- keep performance budgets visible at the page and API layer, not just release time

## 6. Documentation Hygiene

Purpose:
- make docs trustworthy enough to guide implementation work

Current state:
- documentation is extensive and generally coherent on the SQLite-first posture
- root docs, architecture docs, and product docs reinforce the same operating model

Observed risk:
- release and planning narratives overlap
- some docs describe future state while others read as current state
- this makes it harder to know which section is production-ready versus aspirational

Recommended work:
- classify docs as current, historical, or planned
- standardize version markers and dates
- keep one canonical "current system state" document

## Recommended Execution Order

1. Runtime conformance:
   verify that SQLite authority, projection rules, and route behavior match the current docs.
2. Sync-engine decomposition:
   extract dashboard metrics, invariants, and persistence commands out of the monolith.
3. Web surface consolidation:
   align routes and views to one product contract and label experimental surfaces explicitly.
4. Doctrine enforcement:
   make sure no-ruin, triage, and quick-fix behavior are enforced centrally.
5. Release hygiene:
   normalize versioning and re-run the quality gate after structural changes.

## Immediate Starting Section

Start with API and runtime conformance.

Reason:
- it is the narrowest layer that touches everything else
- it will expose whether the UI, doctrine, and SQLite model are still aligned
- it reduces the risk of polishing a surface that is reading the wrong contract
