# CI Gate Contract (v0.4.3-RC)

Required checks for merge/release:
- `verify`
- `build`
- `smoke`
- `uat-report`
- `security-audit`

## Verify
- `npm ci`
- `npm run typecheck`
- `npm --workspace @khal/web run test`

## Build
- `npm ci`
- `npm run build`

## Smoke
- start web server on 3010 from built output
- `node scripts/smoke-routes.mjs --baseUrl=http://localhost:3010`
- `node scripts/perf-smoke.mjs --baseUrl=http://localhost:3010`
- `node scripts/qa-report.mjs`

## UAT Report
- generate UAT evidence template artifact via `scripts/uat-capture.ps1`
- human signoff required before production promotion

## Security Audit
- `npm audit --omit=dev --audit-level=high`
