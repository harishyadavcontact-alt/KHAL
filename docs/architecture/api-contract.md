# API Contract (v0.3)

## `GET /api/state`
Returns:
- `state`: normalized runtime entity graph.
- `dashboard`:
  - `doNow`
  - `optionalityIndex`
  - `robustnessProgress`
  - `virtueSpiral`
    - `stage`
    - `score`
    - `trend`
    - `nextAction`
    - `openFragilityMass`
    - `convexityMass`
    - `executionVelocity`
  - `pathComparator`
    - `unpreparedScore`
    - `preparedScore`
    - `delta`
    - `ruinRisk`
    - `survivalOdds`
    - `timeToImpact`
    - `resourceBurn`
    - `criticalNode`
  - `copilot`
    - `promptState`
    - `suggestedAction`
    - `rationale`
    - `ctaPayload` (`title`, `sourceType`, `sourceId`, `horizon`, `notes`)
- `sync`: db path and freshness metadata.

## `GET /api/war-room-data`
Returns app-oriented projection for UI surfaces (`dashboard`, `war-room`, `missionCommand`, `war-gaming`, `surgical-execution`, `maya`) including:
- core app entities (`domains`, `affairs`, `interests`, `tasks`, `sources`, `missionGraph`, `lineages`, `lineageRisks`, `doctrine`)
- `decisionAcceleration` block mapped from `/api/state.dashboard`.

## Mutation routes
Entity mutation routes (`/api/affairs`, `/api/interests`, `/api/tasks`, and related nested endpoints) return persisted payloads and enforce conflict checks using SQLite modified timestamps.
