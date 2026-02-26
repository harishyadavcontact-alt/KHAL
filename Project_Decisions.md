# Project Decisions (Khal) — Product Spec for Codex (v0.1)

## 0) One-line definition

A fast, narrative-first decision dashboard (“Khal”) that uses a single Excel workbook as the **source of truth**, and provides drill-down, editing, and visualizations across War Room → War Gaming → Surgical Execution → Mission Command.

## 1) Product intent and philosophy (must shape UX)

* The UI is not just CRUD—it must preserve the spreadsheet’s **narrative structure** and produce **split‑second clarity** (“one look = exact clarity on what must be done right now”).
* Core ontology:

  * **Affairs = obligations** that cure fragility and move the user toward robustness.
  * **Interests = options** with asymmetric upside (right side of the barbell) that move the user beyond robustness.
* Two operating modes (UI + language + default views):

  * **Missionary mode**: obligations/affairs, de-risking, clearing fragilities.
  * **Visionary mode**: interests/options, bets, convexity, asymmetric payoff.
* Mathematical/decision foundations referenced: **ergodicity** and **Jensen’s inequality** (used as narrative justification and as “why” behind prioritization and convexity/fragility scoring).

## 2) Target user and use cases

### Primary user

* A single power user (the creator), operating across life domains (state/company/market/personal), using the workbook as a decision operating system.

### Core use cases (v0.1)

1. See the current strategic state at a glance (charts + prioritized list).
2. Drill into War Room narrative hierarchy (state-of-the-art vs state-of-affairs).
3. Add/edit:

   * Domains
   * Ends
   * Means
   * Barbell strategies
   * Affairs
   * Interests
   * Plans/preparations
   * Tasks/subtasks
4. Convert plans/preparations → task chains (scheduler) → execution.
5. Reorganize everything into a hierarchy that makes path/scale dependence visible (Mission Command).
6. Keep Excel as the canonical database, with **bi-directional sync** (edit in UI updates Excel; edit Excel reflects in UI).

## 3) Non-goals (v0.1)

* Multi-user collaboration and permissions.
* Full “agent” functionality (future: **theKhal** conversational commander). v0.1 only includes scaffolding hooks.
* Migration to SQL as primary storage (may be supported later; keep interfaces clean).
* Heavy animations. UX must load quickly, minimal “BS”.

## 4) System model (conceptual)

The workbook contains multiple “layers” (some narrative, some tabular). In product terms:

* **War Room (authoritative)**: strategic domain framing. Contains domains/laws, stakes, risks, fragilities, volatility sources, defenses/offenses, hedges/edges, ends, means (heuristics/methodologies/technologies/techniques), and links to affairs/interests.
* **War Gaming**: scenario drill-down. Plans & preparations, ORKs/KPIs, pre-mortems, black swan planning; derives task chains.
* **Surgical Execution**: the kill chain of tasks/subtasks scheduled by time horizon (week/month/quarter/year).
* **Mission Command**: hierarchical aggregation/prioritization across affairs + interests showing path dependence and scale dependence.
* **Dashboard**: front visual surface.
* **Affairs (structured table)**: defensive layer (robustness).
* **Interests (structured table)**: offensive asymmetry layer (options/bets).

## 5) Data model (entities)

Design a normalized internal model (for code + future DB), but persist to Excel.

### 5.1 Entity list

1. Domain
2. End (goal/outcome)
3. Mean (heuristic/method/methodology/technique/technology)
4. BarbellStrategy (defense/offense, hedge/edge)
5. Fragility (problem/vulnerability/volatility exposure)
6. Affair (obligation/action that cures fragility)
7. Interest (option/bet with asymmetric payoff)
8. Plan (wargaming plan)
9. Preparation (wargaming preparation)
10. Metric (ORK/KPI)
11. Task (execution item)
12. TimeHorizon (week/month/quarter/year)
13. MissionNode (Mission Command hierarchy node)

### 5.2 Keys and relationships

* Domain 1—N End
* End 1—N Mean
* End 1—N Fragility
* Fragility 1—N Affair (each fragility is cured by one or more affairs)
* End 1—N Interest (interests serve ends)
* End 1—N Plan
* Plan 1—N Preparation
* Plan 1—N Metric (ORK/KPI)
* Plan/Preparation 1—N Task (task chain)
* Tasks can be nested: Task (parent) 1—N Task (children)
* Mission Command builds a tree/graph over Affairs + Interests + Tasks:

  * MissionNode references one underlying object (Affair OR Interest OR Task OR End)
  * MissionNode supports explicit dependencies (DAG) + a “primary tree view” projection.

### 5.3 Core fields (minimum required)

#### Domain

* id (UUID)
* name
* description
* category/law (optional)
* state_of_the_art_notes (rich text)
* state_of_affairs_notes (rich text)
* created_at, updated_at

#### End

* id, domain_id
* title
* description
* target_date (optional)
* barbell_strategy_id (optional)
* priority (1–5)
* status (Not Started / In Progress / Done / Parked)

#### Mean

* id, end_id
* title
* type (Heuristic / Methodology / Technique / Technology / Tool)
* notes
* references (links)

#### Fragility

* id, domain_id, end_id (optional)
* title
* description
* volatility_sources (text)
* vulnerability_notes (text)
* stakes (1–10)
* risk (1–10)
* fragility_score (computed; default = stakes * risk)

#### Affair (obligation)

* id, domain_id, fragility_id (optional), end_id (optional)
* title
* description
* stakes (1–10)
* risk (1–10)
* fragility_score (computed; default = stakes * risk)
* timeline (date or date range or text)
* status
* completion_pct (0–100)

#### Interest (option/bet)

* id, domain_id, end_id (optional)
* title / opportunity
* description
* stakes (1–10)
* risk (1–10)
* asymmetry (freeform or numeric)
* upside (freeform or numeric)
* downside (freeform or numeric)
* convexity (0–10 or 1–10)
* status
* notes

#### Plan / Preparation

* id, domain_id, end_id
* type (Plan / Preparation)
* title
* description
* scenario (optional)
* premortem_notes (optional)

#### Metric (ORK/KPI)

* id, plan_id
* type (ORK / KPI)
* name
* target
* current
* unit

#### Task

* id
* source_type (Affair / Interest / Plan / Preparation)
* source_id
* parent_task_id (nullable)
* title
* notes
* horizon (Week / Month / Quarter / Year)
* due_date (optional)
* status
* effort_estimate (optional)

#### MissionNode

* id
* ref_type (End / Affair / Interest / Task)
* ref_id
* parent_node_id (nullable)
* sort_order
* dependency_ids (list)

## 6) Excel as source of truth

### 6.1 Principle

* Excel workbook remains canonical. The app maintains an internal normalized model, but must:

  1. Load from Excel → build internal model.
  2. Apply edits in UI → write back to Excel.
  3. Detect external Excel edits → refresh UI.

### 6.2 Excel constraints (v0.1)

* Some sheets are narrative/layout-driven (War Room, Mission Command, Dashboard). v0.1 should support:

  * “Block parsing” for narrative regions (structured blocks with headings).
  * True tables for structured data (Affairs, Interests, Tasks).

### 6.3 Recommended v0.1 workbook conventions (Codex must implement + document)

To make synchronization reliable, Codex should enforce/introduce:

* A hidden sheet: `_khal_meta`

  * workbook_version
  * last_app_write_timestamp
  * unique ids map (row ↔ UUID)
* Convert structured areas into **Excel Tables** (ListObjects) where possible:

  * `tbl_affairs`, `tbl_interests`, `tbl_tasks`, `tbl_domains`, `tbl_ends`, `tbl_plans`, `tbl_metrics`
* Every row has a stable `id` (UUID) column.
* For narrative blocks (War Room), define a simple markup:

  * Heading rows start with `## ` and belong to the next block.
  * Key/value lines use `key: value`.
  * Nested bullets start with `- `.
  * The app stores a parsed JSON version in `_khal_meta` for fast load.

If the existing workbook cannot be safely reshaped automatically, Codex should ship with a “Normalize Workbook” wizard (one-time), that:

* Creates tables in new sheets while leaving original sheets intact.
* Adds IDs and minimal columns.

## 7) Calculations and derived logic

* `fragility_score = stakes * risk` (default; allow override later).
* “Missionary progress” (robustness proxy):

  * `robustness_progress = sum(completion_pct of Affairs weighted by fragility_score)` (v0.1 can be simpler: mean completion or count done).
* “Visionary exposure” (optionality proxy):

  * `optionality = sum(convexity * stakes)` (simple index).
* Prioritization default heuristic (Mission Command):

  1. Highest fragility_score Affairs first (obligations).
  2. Time horizon: Week > Month > Quarter > Year.
  3. Interests next by convexity (descending) * stakes.
* Path dependence:

  * If a Task depends on another, it cannot be marked Done unless dependencies are Done.

## 8) UX requirements

### 8.1 General

* Web app.
* Must load fast.
* Minimal animations.
* Spreadsheet-like editing where helpful (inline edit, quick add).
* Always show “what matters now” at top.

### 8.2 Global IA (information architecture)

Left nav:

* Dashboard
* War Room
* War Gaming
* Surgical Execution
* Mission Command
* Affairs
* Interests
* Settings (workbook path, sync status, normalization wizard)

Global top bar:

* Current Mode toggle: Missionary ↔ Visionary
* Global search (domains, ends, affairs, interests, tasks)
* Sync indicator (Excel connected / stale / conflict)

### 8.3 Key screens

#### Dashboard (v0.1)

* Two panels:

  * “Do Now” list (top 10 items) generated from Mission Command.
  * “State” visualizations:

    * Radar/spider chart for selected Domain (stakes/risk/fragility/optionality etc. where available)
    * Pie or bar for status breakdown (Affairs by status; Interests by status)
* Quick actions:

  * Add Affair
  * Add Interest
  * Add Task

#### War Room

* Primary: narrative drill-down showing:

  * State of the Art
  * State of Affairs
  * Stakes, risks, fragilities, volatility sources
  * Defenses/offenses, hedges/edges, ends/means
* Must support expanding/collapsing hierarchy.
* Edit capability:

  * Inline edit for key/value
  * Add subsection

#### Affairs

* Table view + filters:

  * Domain
  * Status
  * Fragility score range
  * Time horizon
* Bulk edit status and completion.

#### Interests

* Table view + “bet card” view.
* Core emphasis: stakes, risk, convexity, asymmetry.

#### War Gaming

* For a selected Domain/End:

  * Plans, preparations
  * ORKs/KPIs
  * Generate task chain → pushes tasks into Surgical Execution

#### Surgical Execution

* Time horizon tabs: Week / Month / Quarter / Year
* Kanban (Not Started / In Progress / Done) + calendar list (v0.1 can do list first)

#### Mission Command

* Hierarchy tree view built from Ends → Affairs/Interests → Tasks.
* Also shows dependency graph warnings (blocked tasks).

## 9) Sync, conflicts, and offline assumptions

### Assumptions (v0.1)

* Single user editing most of the time.
* Excel file is local (Windows) and reachable by the backend.

### Conflict policy

* Detect when Excel changed since last read (file modified time + `_khal_meta.last_app_write_timestamp`).
* If conflicts:

  * Show a “Refresh / Keep My Changes / Diff” modal.
  * v0.1 can implement a conservative rule: **refresh required** before further edits.

## 10) Architecture (ship-fast monolith)

### 10.1 Proposed v0.1 stack (Codex-friendly)

* Frontend: Next.js (React + TypeScript)
* Backend: Next.js API routes (same repo) OR Express in same monorepo
* Excel I/O:

  * Use a Node Excel library (e.g., `exceljs`) for reading/writing tables and cells.
* Charts:

  * Simple charting library (e.g., Chart.js) for radar + status charts.

### 10.2 Modules

* `excel/`:

  * WorkbookLoader
  * TableReader/Writer
  * NarrativeBlockParser
  * MetaSheetManager
* `domain/`:

  * Types (Domain, End, Affair, Interest, Task…)
  * Derivations (scores, prioritization)
* `api/`:

  * REST endpoints (or tRPC) for CRUD + sync
* `ui/`:

  * Pages + components

### 10.3 API surface (minimum)

* GET `/api/state` → entire normalized state + derived summaries
* POST `/api/affairs` (create)
* PATCH `/api/affairs/:id`
* POST `/api/interests`
* PATCH `/api/interests/:id`
* POST `/api/tasks`
* PATCH `/api/tasks/:id`
* POST `/api/wargaming/:endId/generateTasks` → creates tasks from plan/prep
* POST `/api/sync/refresh`

## 11) MVP scope (v0.1 definition)

Ship when these are working end-to-end:

1. Connect to workbook path + load.
2. Show Dashboard with “Do Now” and at least 2 charts.
3. CRUD for Affairs and Interests (table views) with write-back to Excel.
4. Basic War Room narrative viewer with drill-down (read-first; minimal edit acceptable in v0.1).
5. Surgical Execution task list by horizon (read + edit status).
6. Mission Command basic hierarchy (generated view).

## 12) Edge cases to handle

* Missing sheets / renamed sheets → show mapping screen.
* Non-normalized layout in War Room → fallback to “raw view” plus recommended normalization.
* Invalid numeric ranges (stakes/risk/convexity) → clamp + show validation error.
* Duplicate IDs → regenerate with warning.
* Excel locked/open in another app → handle write errors gracefully and queue retry (manual).

## 13) Acceptance criteria (Codex checklist)

* App loads from workbook in < 2 seconds for typical size (target; measure locally).
* Edits in UI persist to Excel reliably (Affairs/Interests/Tasks).
* Refresh shows updates after manual Excel edits.
* Prioritized “Do Now” list is deterministic and explainable (show “why” tooltip: score + horizon + dependency block).
* No heavy animations.

## 14) Implementation plan (thin slices)

Slice 1: Workbook connector + read-only state

* Load Affairs + Interests into UI tables.

Slice 2: Write-back CRUD

* Create/edit Affairs + Interests, persist to Excel.

Slice 3: Derived scores + Dashboard

* fragility_score, optionality index, radar chart.

Slice 4: Tasks + horizons

* Add tasks, status updates, horizon filtering.

Slice 5: Mission Command hierarchy

* Generate tree + blocked states.

Slice 6: War Room narrative view

* Parse blocks + drill-down.

## 15) Future hooks (not implemented in v0.1)

* Conversational agent: **theKhal** (reads state + issues commands; writes via the same API).
* Plugin system (open-source community contributions).
* DB backing store (Postgres) with Excel export/import.
