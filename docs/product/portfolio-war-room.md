# Portfolio War Room

Status: downstream

## One-line definition
Portfolio War Room is Mission Command for multiple bets. It is the surface that lets the operator command several active projects, ventures, and probes from one strategic-operational view.

Derived from `docs/product/Khal_genesis.md`. This document defines the local surface contract for Portfolio War Room.

## Placement inside KHAL
- Canonical route: `/missionCommand/portfolio`
- Compatibility alias: `/portfolio`
- Doctrine home: Mission Command

Portfolio War Room is not:
- a task manager
- a generic project tracker
- a second copy of Interests
- a separate app

It is the command layer above bets.

## Product doctrine
- Active runtime is the selected SQLite database as defined in `docs/product/Khal_genesis.md`.
- Visual signal beats textual clutter.
- One tile equals one strategic bet, not one repository.
- The surface is inspect-first. Editing exists, but does not dominate the screen.
- The portfolio remains distinct from Affairs and Interests.
- v1 supports one optional primary `Interest` link per project. No Affair or mission-node graph links are added yet.

## Barbell model
### Strategic roles
- `core`: conviction bet
- `option`: lightweight right-tail bet
- `probe`: short information-gathering bet
- `archive`: preserved but unfunded
- `killed`: explicitly terminated and retained for lessons

### Stages
- `idea`
- `framing`
- `build`
- `shipping`
- `traction`
- `stalled`
- `archived`

### Visible signals
Every project card should make these obvious in seconds:
- strategic role
- stage
- signal band
- current bottleneck
- last ship
- next milestone
- active experiment

## Data model
Canonical SQLite tables:
- `portfolio_projects`
- `portfolio_ship_logs`
- `portfolio_evidence`
- `portfolio_decision_gates`
- `portfolio_experiments`
- `portfolio_repo_adapters`

Important design choices:
- signal is band-first (`high`, `watch`, `low`)
- repo metadata is optional and subordinate to the bet
- adapter rows are manual-first in v1 and reserve a clean path for future `project.meta.json` ingestion

## UI surfaces
### Landing page
The landing page is the commander board. It includes:
- summary strip
- role/stage filters
- sort and density controls
- active-only toggle
- project tiles
- shipping radar
- experiment board
- cemetery / lessons segment

### Project command page
Each project has a dedicated command page with:
- mission
- wedge
- current experiment
- evidence
- shipping log
- decision gates
- kill criteria
- notes / retained lessons

## Interaction model
Supported operations:
- create project
- edit project
- archive
- kill
- restore
- add ship log
- add experiment
- add evidence
- add decision gate
- update bottleneck
- update signal
- filter by role / stage / active state

## Invariants
Portfolio War Room participates in runtime invariant evaluation.

Current soft checks:
- active project without experiment loop
- core or stalled project without open gate
- active project without declared bottleneck
- archived or killed project without retained lesson

## Future extension path
v1 is deliberately manual-first. Future expansion can add:
1. `project.meta.json` import through `portfolio_repo_adapters`
2. local repo activity ingestion
3. richer map-aware links after doctrine clarity is earned
4. more explicit project-to-execution handoff
