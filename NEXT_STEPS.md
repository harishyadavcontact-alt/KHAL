NEXT_STEPS.md

Current Phase: v0.4.2 Fractal War Gaming (mode-specific grammar + hybrid role flow)

Immediate build slice:
- Add `craft` as first-class war-gaming mode (`/war-gaming/craft`).
- Enforce mode-specific grammar registry across `source/domain/affair/interest/craft/lineage/mission`.
- Introduce hybrid role flow:
  - `Missionary` dependency-first gating.
  - `Visionary` jump with deterministic warnings.
- Keep Lab as semantic aggregator for interest experiments.
- Keep API contracts additive and route-compatible.

Validation gates:
- `npm run typecheck`
- `npm run build`
- `npm --workspace @khal/web run test`
- `npm --workspace @khal/web run smoke:routes`

Cleanup policy:
- conservative prune only
- preserve compatibility redirects
- keep `Genesis.xlsx` as archival reference
