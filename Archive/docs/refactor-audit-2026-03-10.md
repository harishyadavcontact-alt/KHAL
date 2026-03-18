# Refactor Audit

Date: 2026-03-10

Goal:
- improve clarity of the codebase before adding features
- reduce the cost of changing the decision tree and project sections
- identify the places where doctrine, routes, and UI structure are currently duplicated

## Executive Summary

The repository is workable, but the current shape will make small feature additions more expensive than necessary.

The main issue is not only file length. The deeper issue is duplicated structural knowledge:
- section names are defined in multiple UI layers
- war-gaming modes are defined in docs, types, route parsers, tests, and UI state separately
- route-to-view translation exists in multiple places
- API orchestration and domain logic are partially mixed into large top-level files

This is fixable.

The highest-leverage refactor is to introduce one canonical section and decision-tree registry, then make docs, routes, and UI read from that shape instead of re-declaring it in several files.

## Priority 1: Canonical Section Registry

Problem:
- section identity is duplicated across:
  - `apps/web/components/ops-shell/nav-config.ts`
  - `apps/web/components/app-shell.tsx`
  - `apps/web/lib/war-room/routes.ts`
  - `apps/web/components/war-room-v2/war-room-v2-app.tsx`
  - route files under `apps/web/app/`

Why this matters:
- if you change a section label, route, or grouping, you have to remember multiple files
- this increases drift and makes decision-tree changes feel larger than they are

Recommended refactor:
- create a single registry such as `apps/web/lib/navigation/sections.ts`
- define for each section:
  - stable id
  - route
  - label
  - compatibility aliases
  - route prefixes
  - ontology layer
  - whether it is canonical, compatibility-only, or experimental

Then derive:
- ops nav items
- route-to-view mapping
- bypass prefixes
- home page section list
- compatibility redirect tests

## Priority 2: Canonical Decision Tree / War-Gaming Mode Registry

Problem:
- war-gaming mode structure is duplicated across:
  - `docs/decision-tree/war-room-fractal-decision-tree.md`
  - `apps/web/components/war-room-v2/types.ts`
  - `apps/web/lib/war-room/route-mode.ts`
  - tests under `apps/web/test/`
  - UI logic in `apps/web/components/war-room-v2/war-room-v2-app.tsx`

Why this matters:
- a small change to the decision tree for one section currently risks breaking route parsing, mode validation, tests, and UI sequencing independently
- doctrine edits should feel like editing a model, not chasing strings

Recommended refactor:
- create `apps/web/lib/decision-tree/registry.ts`
- define:
  - all modes
  - titles
  - predecessors
  - ontology parent section
  - route path
  - grammar summary
  - risky-action gating policy

Then derive:
- `WarGameMode` type from the registry
- route mode parsing
- fractal flow rails
- dependency warnings
- test expectations
- documentation snapshots where possible

## Priority 3: Split the Sync Engine Monolith

File:
- `packages/sync-engine/src/index.ts`

Current issue:
- SQL loading, mapping, metrics, invariants, and writes are tightly coupled in one file

Why this matters:
- every change touches a wide blast radius
- it is difficult to test one concern in isolation
- future decision-engine and dashboard additions will keep bloating this file

Recommended split:
- `src/read-model/loaders/*`
- `src/dashboard/*`
- `src/invariants/*`
- `src/commands/*`
- `src/sql/*`

Suggested first extraction:
- dashboard metrics block
- invariant evaluation block
- affair/interest/task write commands

## Priority 4: Split the Web API Aggregator

File:
- `apps/web/lib/api.ts`

Current issue:
- this file appears to act as a broad service layer for many domains

Why this matters:
- it is likely becoming the informal second monolith on top of the sync engine
- route behavior becomes harder to reason about when one file aggregates too much shaping logic

Recommended split:
- `apps/web/lib/api/war-room.ts`
- `apps/web/lib/api/affairs.ts`
- `apps/web/lib/api/interests.ts`
- `apps/web/lib/api/lineage.ts`
- `apps/web/lib/api/doctrine.ts`
- `apps/web/lib/api/portfolio.ts`
- `apps/web/lib/api/drafts.ts`

Rule:
- keep route handlers thin
- keep shaping and validation in domain-specific files

## Priority 5: Retire or Isolate Legacy App Shell Logic

Files:
- `apps/web/components/app-shell.tsx`
- `apps/web/components/war-room-v2/war-room-v2-app.tsx`
- `apps/web/components/ops-shell/*`

Current issue:
- there are multiple navigation/app-shell patterns in the repo
- `war-room-v2-app.tsx` contains a large amount of orchestration, routing, fetch logic, and mutation logic in one client component

Why this matters:
- this is likely leftover transitional architecture
- it is easy for old and new shells to diverge in behavior and section semantics

Recommended refactor:
- choose one shell architecture as canonical
- mark the other as legacy and reduce its responsibilities
- move war-game save/mutation flows into reusable action modules
- avoid keeping route logic in a large stateful client component when route files already exist

## Priority 6: Reduce Type Sprawl in `war-room-v2/types.ts`

File:
- `apps/web/components/war-room-v2/types.ts`

Current issue:
- this file is over 1,000 lines and mixes:
  - app view state
  - domain DTOs
  - visual chart types
  - doctrine types
  - decision engine types
  - mission/lineage/time horizon types

Why this matters:
- a small change creates noisy diffs
- type discovery is slower than it should be

Recommended split:
- `types/navigation.ts`
- `types/runtime.ts`
- `types/doctrine.ts`
- `types/decision.ts`
- `types/visuals.ts`
- `types/lineage.ts`

## Priority 7: Clean Up Route Alias / Compatibility Handling

Current issue:
- route aliases such as `/laws`, `/crafts`, `/lineages`, `/mission-command`, and `/settings` are repeated in docs and code

Why this matters:
- compatibility is useful, but only if clearly centralized
- otherwise aliases turn into hidden extra routes to maintain

Recommended refactor:
- keep a single alias registry
- generate redirect pages from the registry where practical
- ensure tests assert the registry rather than hand-maintained string lists

## Priority 8: Clarify Current vs Planned Product Surface

Problem:
- the repo includes current, recent-release, and planned narratives at once:
  - `v0.4.3`
  - `v0.4.4`
  - `v0.4.5-R1`
  - `v0.5 planning`

Why this matters:
- it is harder to know whether a section is stable, experimental, or only conceptually planned
- refactor work should preserve current behavior, not speculative behavior

Recommended refactor:
- maintain one "current product contract" document
- mark others as:
  - released history
  - active implementation target
  - planned

## Specific Decision-Tree Improvement Path

Yes, changing the decision tree by section is possible, but it should be done after introducing one registry.

Recommended sequence:
1. Create canonical section registry.
2. Create canonical decision-tree registry.
3. Point war-gaming route parsing and UI flow to that registry.
4. Update tests to derive expected sections/modes from the registry.
5. Update docs to reflect the same structure.

After that, section-level changes become much cheaper:
- add a new section
- rename a section
- change predecessor rules
- tighten or loosen risky-action gating
- move a section under a different macro branch

## Best Immediate Refactor Targets

1. `apps/web/components/ops-shell/nav-config.ts`
   Reason: easy starting point for centralizing section identity.

2. `apps/web/lib/war-room/routes.ts`
   Reason: direct route mapping should come from the same registry.

3. `apps/web/lib/war-room/route-mode.ts`
   Reason: war-gaming modes should come from a central decision-tree definition.

4. `apps/web/components/war-room-v2/types.ts`
   Reason: split only the navigation and decision-tree related types first.

5. `packages/sync-engine/src/index.ts`
   Reason: extract metrics and invariants into separate modules before adding more dashboard behavior.

## Recommended Next Move

Start with structural centralization, not visual cleanup.

The most valuable first implementation would be:
- build a canonical section registry
- build a canonical decision-tree mode registry
- refactor current route/nav helpers to consume them

That gives the project a stable spine for future features and for section-specific decision-tree edits.
