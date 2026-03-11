# Plan 1 — 100% Closure Checklist (Strict)

Status legend: `GREEN` = complete and validated, `RED` = open.

## Ordered execution checklist

1. **Doctrine-aware quick-action routing (source gaps)** — `GREEN`
   - Files:
     - `apps/web/lib/decision-spec/schema.ts`
     - `apps/web/lib/decision-spec/index.ts`
     - `apps/web/app/api/decision/quick-action/route.ts`
   - Tests:
     - `apps/web/test/tri-readable-api-contract.test.ts`
     - `apps/web/test/wargame-fractal-flow.test.ts`

2. **Doctrine warnings propagated into generated Affairs/Interests** — `GREEN`
   - Files:
     - `apps/web/lib/api/source-map.ts`
   - Tests:
     - `apps/web/test/source-map.test.ts`

3. **Mission ordering penalty + explanation chips** — `GREEN`
   - Files:
     - `apps/web/lib/doctrine/gaps.ts`
     - `apps/web/lib/war-room/mission-ranking.ts`
     - `apps/web/components/war-room-v2/wargame_mission.tsx`
     - `apps/web/components/war-room-v2/MissionCommand.tsx`
   - Tests:
     - `apps/web/test/wargame-mission-ordering.test.ts`
     - `apps/web/test/mission-ranking-parity.test.ts`

4. **Reduce mission dependency on generic `/api/war-room-data` path** — `GREEN`
   - Files:
     - `apps/web/lib/api.ts`
     - `apps/web/app/api/mission-command/bootstrap/route.ts`
     - `apps/web/lib/war-room/useMissionCommandBootstrap.ts`
     - `apps/web/app/missionCommand/page.tsx`
   - Tests:
     - `apps/web/test/mission-bootstrap-parity-contract.test.ts`

5. **Reduce mock/runtime split in war-room-data path** — `GREEN`
   - Files:
     - `apps/web/app/api/war-room-data/route.ts`
     - `apps/web/lib/war-room/useWarRoomData.ts`

6. **Contract-boundary signal normalization (confidence -> signal band)** — `GREEN`
   - Files:
     - `apps/web/lib/war-room/signal-language.ts`
     - `apps/web/lib/api.ts`
     - `apps/web/components/war-room-v2/types.ts`
     - `apps/web/components/war-room-v2/MissionCommand.tsx`
     - `apps/web/app/vision-command/page.tsx`
   - Tests:
     - `apps/web/test/signal-language.test.ts`
     - `apps/web/test/war-room-data-contract.test.ts`
     - `apps/web/test/mission-command-bootstrap-contract.test.ts`

7. **Vision Command readiness artifact** — `GREEN`
   - Files:
     - `docs/release/vision-command-readiness-checklist.md`
     - `apps/web/app/vision-command/page.tsx`
