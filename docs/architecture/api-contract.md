# API Contract (v0.4.2)

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
Returns app-oriented projection for UI surfaces (`dashboard`, `war-room`, `missionCommand`, `war-gaming`, `surgical-execution`, `maya`, `lab`) including:
- core app entities (`domains`, `affairs`, `interests`, `tasks`, `sources`, `missionGraph`, `lineages`, `lineageRisks`, `doctrine`)
- `decisionAcceleration` block mapped from `/api/state.dashboard`.

War Gaming v0.4.2 contract expectations:
- route modes include:
  - `source`
  - `domain`
  - `affair`
  - `interest`
  - `craft`
  - `lineage`
  - `mission`
- UI-only role model:
  - `MISSIONARY`
  - `VISIONARY`
- UI-only grammar/evaluation types:
  - `WarGameGrammarSpec`
  - `WarGameModeEvaluation`
  - `WarGameDependencyStatus`

`interests` is additively extended for Lab mode with optional fields:
- `labStage` (`FORGE` | `WIELD` | `TINKER`)
- `hypothesis`
- `maxLossPct`
- `expiryDate`
- `killCriteria`
- `hedgePct`
- `edgePct`
- `irreversibility`
- `evidenceNote`
- derived in UI: `asymmetryScore`, `protocolReady`

## Mutation routes
Entity mutation routes (`/api/affairs`, `/api/interests`, `/api/tasks`, and related nested endpoints) return persisted payloads and enforce conflict checks using SQLite modified timestamps.

`POST /api/plans` `sourceType` accepts additively:
- `SOURCE`
- `DOMAIN`
- `AFFAIR`
- `INTEREST`
- `CRAFT`
- `LINEAGE`
- `MISSION`
