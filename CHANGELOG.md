# Changelog

## v0.4.3-RC - Quality/Release Hardening (2026-03-04)
- Replaced GitHub CI with deterministic npm-based split jobs (`verify`, `build`, `smoke`, `security-audit`) and concurrency controls.
- Added release and security workflows plus weekly Dependabot for npm and GitHub Actions.
- Added cross-platform quality scripts:
  - `scripts/smoke-routes.mjs`
  - `scripts/perf-smoke.mjs`
  - `scripts/qa-report.mjs`
  - `scripts/quality-gate.ps1`
  - `scripts/uat-capture.ps1`
- Added production-readiness docs:
  - UAT checklist/evidence template
  - security baseline
  - performance budgets
  - release runbook
- Hardened typecheck determinism by removing direct dependence on generated `.next/types` in web `tsconfig`.

## v0.3.4 - Learning Loop + Operating Memory (2026-03-04)
- Added Decision Replay, Outcome Attribution, Assumption Register, and Recovery Playbooks panels in Decision Chamber.
- Added additive payload and AppData support for replay/attribution/assumptions/playbooks.
- Kept compatibility: no route removals and no schema-breaking API changes.

## v0.3.3 - Optionality + Temporal Control (2026-03-04)
- Added Optionality Budget, Convexity Pipeline, Fragility Heat Timeline, Decision Latency Meter, and Counterfactual Delta surfaces.
- Wired tripwire-aware control behavior into Surgical Execution and copilot queue actions.
- Added deterministic mock + test coverage for operational metrics.

## v0.3.2 - Dependency + Mission Causality (2026-03-04)
- Added Dependency Blast Radius, Mission Bottleneck detector, Hedge Coverage matrix, and Correlation Risk card.
- Integrated War Gaming + Mission Command panel wiring with non-breaking prop flow.
- Preserved existing comparator and route behavior.

## v0.3.1 - Hard Safety + Protocol Visibility (2026-03-04)
- Added No-Ruin Tripwire, Ruin Ledger, Doctrine Violation Feed, and Confidence/Evidence strip.
- Extended sync-engine dashboard payload additively with robustness metadata blocks.
- Added feature flags for controlled rollout and fallback handling.
- Full quality gate passed: typecheck, build, web tests, sync-engine tests, and route smoke.
