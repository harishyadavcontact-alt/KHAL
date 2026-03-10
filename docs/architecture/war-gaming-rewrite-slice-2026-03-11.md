# War Gaming Rewrite Slice

Date: 2026-03-11

Goal:
- reduce the mock/runtime split on the War Gaming route
- define the first doctrine seams to extract before deeper UI changes

## What Changed In This Slice

- `apps/web/components/ops-pages/WarGamingModeClient.tsx` now loads a War Gaming-specific bootstrap contract instead of the generic War Room payload.
- `apps/web/app/api/war-gaming/bootstrap/route.ts` exposes a dedicated runtime bootstrap for the rewrite path.
- `apps/web/lib/war-room/useWarGamingBootstrap.ts` contains the only remaining frontend-only fallback for this path.
- `apps/web/lib/war-room/bootstrap.ts` defines the narrow contract the route consumes.

This does not remove all legacy coupling. It does remove one important source of drift:
- War Gaming no longer depends on `/api/war-room-data` for its main runtime load path.
- frontend-only mock fallback is isolated to the War Gaming bootstrap loader instead of shared with every War Room surface.

## Doctrine Seams To Extract First

### 1. Scenario / Threat / Response Contract

Why first:
- the ontology already treats this chain as canonical
- runtime invariants already validate the parent-child structure
- drafts promotion already creates these entities
- War Gaming still does not consume them as a first-class protocol surface

Extraction target:
- move the read/write contract for scenario, threat, and response into a dedicated War Gaming doctrine module
- keep the API shape focused on:
  - scenario framing
  - threat surface
  - response and hedge path
  - linkage to craft, domain, and lineage context

Result:
- War Gaming can evaluate doctrine from explicit response logic instead of only from broad monolithic app data

### 2. Protocol Evaluation Seam

Why second:
- `apps/web/components/war-room-v2/WarGaming.tsx` still performs UI composition and protocol derivation in the same file
- readiness, dependency warnings, triage state, and doctrine surfacing should not be derived inside the page component

Extraction target:
- a server-safe evaluator layer that accepts:
  - selected mode
  - selected target
  - doctrine contracts
  - scenario/threat/response context

Result:
- doctrine scoring can be tested without rendering the entire screen

### 3. Doctrine Language Seam

Why third:
- some operator-facing surfaces still expose `confidence` naming while newer surfaces use `signal`
- renaming now without separating contracts would create broad churn

Extraction target:
- isolate evidence/signal metadata behind one doctrine-facing type before renaming the remaining UI surfaces

Result:
- language cleanup becomes a contract edit rather than a repo-wide sweep

## Next Recommended Implementation

1. Create `apps/web/lib/api/wargaming-doctrine.ts`.
2. Move scenario/threat/response reads there from the generic API layer.
3. Add a focused bootstrap payload section such as `responseLogic`.
4. Extract protocol evaluation out of `WarGaming.tsx` into a dedicated module with tests.
