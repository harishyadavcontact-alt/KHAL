# Performance Budgets (v0.4.3-RC)

## Scope
These are CI smoke budgets for fast regression detection, not final production SLOs.

## Route/API Budgets
- `/dashboard`: target <= 1500ms
- `/war-gaming/domain`: target <= 1500ms
- `/api/war-room-data`: target <= 2500ms (cold-start tolerant)
- `/api/decision-spec`: target <= 900ms

## Policy
- `duration <= budget`: pass
- `budget < duration <= 2x budget`: warning (non-blocking)
- `duration > 2x budget`: fail (blocking)
- any non-2xx/3xx status: fail (blocking)

## Reporting
- Script: `node scripts/perf-smoke.mjs --baseUrl=http://localhost:3010`
- Output: `artifacts/quality/perf-smoke.json`

## Next Iteration
- Add percentile sampling and per-mode API budgets.
- Add bundle-size deltas for key war-gaming surfaces.
