NEXT_STEPS.md

Current Phase: v0.3 visual decision acceleration

Immediate build slice:
- Virtue Spiral panel (Dashboard + Mission Command).
- Dual-path comparator (War Gaming header).
- Do-Now action copilot card with one-click task queue.
- API dashboard extensions on `/api/state`:
  - `virtueSpiral`
  - `pathComparator`
  - `copilot`

Validation gates:
- `npm run typecheck`
- `npm run build`
- `npm --workspace @khal/web run test`
- `npm --workspace @khal/web run smoke:routes`

Cleanup policy:
- conservative prune only
- preserve compatibility redirects
- keep `Genesis.xlsx` as archival reference
