# Vision Command Readiness Checklist

Purpose: move from Mission Command parity to Vision Command read-only synthesis without breaking runtime decision clarity.

## Gate 1 — Shared ranking and penalty semantics
- [x] Mission ranking logic moved to shared library (`mission-ranking.ts`).
- [x] Component wrapper parity test prevents drift.
- [x] Determinism test verifies stable repeated ordering results.

## Gate 2 — Mission bootstrap isolation
- [x] Dedicated mission bootstrap endpoint added (`/api/mission-command/bootstrap`).
- [x] Mission Command page now loads through mission-specific bootstrap hook.
- [x] Contract test verifies doctrine-aware fields are present.

## Gate 3 — Signal language normalization
- [x] Confidence language normalized to operator signal bands (`STRONG` / `WATCH` / `WEAK`).
- [x] Mission Command renders normalized operator signal chip.
- [x] Unit tests cover signal mapping and display tone stability.

## Gate 4 — Vision Command thin slice
- [x] `/vision-command` read-only synthesis surface added.
- [x] Surface intentionally avoids mutation/quick-action side effects.
- [x] Uses same runtime bootstrap context as mission for coherence.

## Gate 5 — Ship discipline
- [x] Keep `main` shippable with passing tests.
- [x] Continue incremental slices: narrative first, actuation later.
