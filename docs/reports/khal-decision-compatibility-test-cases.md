# KHAL Decision-Logic Compatibility Test Cases (Directional Gate)

Generated for build-phase corrective validation.

## Objective
- Validate that KHAL decision logic is directionally correct using runtime contracts.
- Enforce hard invariants for core ontology/flow.
- Capture secondary drift as warnings (non-blocking).

## Scope
- War Room ontology compatibility.
- Volatility -> Domain -> Lineage hierarchy compatibility.
- Affairs vs Interests semantic lane compatibility.
- War-gaming mode and route compatibility.
- Mission hierarchy roundtrip integrity.

Out of scope for this cycle:
- UI/keyboard interaction tests.
- Wargaming protocol redesign.

## Canonical Compatibility Contract
1. War Room is the authoritative layer.
2. Volatility layer is fixed to 6 slots:
   - Law of Universe
   - Law of Nature
   - Law of Nurture
   - Law of Land
   - Law of Time
   - Law 6 (TBD reserved slot)
3. Domains are subordinate to volatility source.
4. Affairs map to obligation/hedge lane.
5. Interests map to optionality/edge lane.
6. Lineage remains independently analyzable.
7. War-gaming modes are exact:
   - `source`, `domain`, `affair`, `interest`, `mission`, `lineage`
8. Traversal order contract:
   - top-to-bottom by layer depth
   - left-to-right by canonical slot order
   - stable tie-break using order/lexical key

## Directional Gate Policy
### Hard-fail invariants
- War-gaming mode contract mismatch.
- Domain-to-source resolvability failure.
- Missing affair/interest core lane contracts.
- Mission hierarchy parent/dependency integrity break.

### Warning-only checks
- Unpopulated canonical volatility slots.
- Missing optional narrative fields:
  - `stakes`, `fragility`, `vulnerabilities`, `hedge`, `edge`
- Partial lineage actor-type coverage.

## Executable Suite
- File: [decision-compatibility.test.ts](/c:/Users/290678/Desktop/Khal/apps/web/test/decision-compatibility.test.ts)
- Helper: [decision-compatibility.fixture.ts](/c:/Users/290678/Desktop/Khal/apps/web/test/decision-compatibility.fixture.ts)
- Script: `npm --workspace @khal/web run test:decision-compat`

## Test Matrix
### A) Ontology and hierarchy
- Domain slot projection resolves each domain to one source label.
- Deterministic hierarchy sort follows depth -> slot -> tie-break.
- Affair/interest lane assignment is not inverted.

### B) Volatility canon
- Exactly six canonical slots exist including `Law 6 (TBD)`.
- Legacy label compatibility:
  - `Laws of Physics` -> Universe.
  - `Law of Jungle` -> Law 6 compatibility bucket.

### C) Semantic direction
- Affairs satisfy minimal obligation contract:
  - `domain`, `context.associatedDomains`, `plan`, `means`.
- Interests satisfy minimal optionality contract:
  - `domain`, `objectives`.

### D) War-gaming coverage
- Parser accepts only canonical mode set.
- Smoke-route list includes each `/war-gaming/<mode>` endpoint.

### E) Mission hierarchy
- Roundtrip put/get preserves parent references.
- Dependencies only reference in-scope nodes.
- Returned order is stable by sort order.

### F) Lineage exposure
- Risks are groupable by source and domain.
- SELF and FAMILY nodes do not overlap.

## Route Smoke Alignment Reference
Canonical smoke script:
- [smoke-routes-3010.ps1](/c:/Users/290678/Desktop/Khal/scripts/smoke-routes-3010.ps1)

Expected war-gaming coverage in smoke list:
- `/war-gaming/source`
- `/war-gaming/domain`
- `/war-gaming/affair`
- `/war-gaming/interest`
- `/war-gaming/mission`
- `/war-gaming/lineage`

## Acceptance Criteria
1. `test:decision-compat` passes with zero hard failures.
2. Existing `@khal/web` tests remain green.
3. This report and executable checks remain aligned.
4. Output separates `hardFailures[]` from `warnings[]` to prevent silent logic drift.
