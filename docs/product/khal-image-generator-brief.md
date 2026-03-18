# KHAL Product Brief for Image Generation

## Purpose
KHAL is a local-first decision-making operating system for one operator.

Its job is to help the operator:
- classify volatility
- understand consequence structure
- reduce fragility
- preserve convex optionality
- turn judgment into hierarchy, plans, and task chains

KHAL is not:
- a generic dashboard
- a generic project manager
- a business intelligence tool
- a note app with charts

KHAL is a decision operating system.

## Runtime authority
- Runtime data authority: `data/KHAL.sqlite`
- Excel `Genesis.xlsx` is archival/reference only

## Product spine
- `War Room` = see the decision
- `War Gaming` = game the decision
- `Mission Command` = organize affairs
- `Vision Command` = organize interests
- `Surgical Execution` = execute task chains
- `Dashboard` = global system telemetry

## Core doctrine
KHAL organizes reality into two main layers.

### State of the Art
This is the framing and consequence layer.

- `Map`
  - decision type
  - tail behavior
  - quadrant
  - admissible posture
- `Stone`
  - `Skin in the Game`
    - stakes
    - risks
    - lineage
    - players / fragilistas
    - capital at risk
    - time at risk
    - reputation at risk
  - `Philosopher's Stone`
    - fragility
    - vulnerabilities
    - non-linearity
    - propagation
    - irreversibility
    - short volatility / long volatility exposure
- `Ends`
  - hedge
  - edge
  - barbell posture
- `Means`
  - craft
  - heuristics
  - avoid methods

### State of Affairs
This is the downstream action layer.

- `Affairs`
  - obligations
  - remove fragility
  - move toward robustness
- `Interests`
  - options
  - create convex payoff
  - move beyond robustness

## Major product objects
- sources of volatility
- domains
- source-to-domain map profiles
- affairs
- interests
- crafts
- heaps
- models
- frameworks
- barbell strategies
- heuristics
- stacks
- protocols
- rules
- wargames
- scenarios
- threats
- responses
- lineages
- lineage entities
- lineage risks
- mission graph
- plans
- tasks
- drafts
- structural anchors
- promotion events
- portfolio projects
- portfolio experiments
- portfolio evidence
- portfolio decision gates
- portfolio ship logs
- time horizon profile
- deadlines

## End-to-end product flow
1. `War Room`
   - see the current decision landscape
   - inspect sources, domains, and crafts
2. `War Gaming / Source`
   - game one source of volatility into a domain-specific posture
   - generate downstream affairs and interests
3. `War Gaming / Domain`
   - inspect one domain through State of the Art and State of Affairs
4. `War Gaming / Craft`
   - inspect admissible methods and doctrine chains
5. `War Gaming / Affair`
   - game one obligation
6. `War Gaming / Interest`
   - game one option
7. `Mission Command`
   - aggregate affairs into hierarchy and sequencing
8. `Vision Command`
   - aggregate interests into hierarchy and opportunity structure
9. `Surgical Execution`
   - turn plans and branches into task chains
10. `Dashboard`
   - inspect global telemetry and high-signal visuals

## Surface-by-surface feature inventory

### 1. War Room
Function: authoritative ontology and orientation surface.

Current runtime-backed structure:
- `Sources of Volatility`
- `Domains`
- `Crafts`

War Room should help the operator understand:
- what forces are active
- where those forces land
- what methods exist

War Room objects:
- source cards / source register
- domain cards / domain opening
- craft cards / craft library entry

War Room is the top-level map, not the place for heavy simulation.

### 2. War Gaming
Function: planning and simulation layer.

War Gaming is split into focused chambers.

#### 2.1 War Gaming / Source
Function: game a source of volatility before committing to downstream action.

This chamber should answer:
- what kind of force is this
- what domains does it hit
- what kind of world does it create in one selected domain
- what posture follows
- what downstream affair or interest does it justify

Current runtime-backed concepts in this chamber:
- source of volatility
- linked domains
- source map profiles
- State of the Art protocol
- State of the Art projection
- Map
- Stone
- Ends
- Means
- scenario / threat / response chains
- create affair from hedge
- create interest from edge

Source chamber flow:
1. pick source
2. inspect affected domains
3. pick one source-domain pair
4. work through `Map`
5. work through `Stone`
6. define `Ends`
7. define `Means`
8. pressure test with `Scenario / Threat / Response`
9. generate `Affair` and `Interest`

#### 2.2 War Gaming / Domain
Function: inspect a domain as a decision chamber.

This chamber should answer:
- what is true in this domain now
- what is at risk here
- what fragility structure exists here
- what hedge and edge posture applies here
- what affairs and interests are currently active here

Current runtime-backed concepts:
- domain posture
- State of the Art projection
- State of Affairs
- active domain affairs
- linked interests
- lineage risk heatgrid
- lineage risk register
- barbell / means coverage

Ideal chamber structure:
- `State of the Art`
  - `Skin in the Game`
  - `Philosopher's Stone`
  - `Ends`
  - `Means`
- `State of Affairs`
  - `Affairs`
  - `Interests`
- lineage as a lens, not clutter

#### 2.3 War Gaming / Craft
Function: inspect admissible methods.

Current runtime-backed craft ladder:
- craft
- heaps
- models
- frameworks
- barbell strategies
- heuristics
- stacks
- protocols
- rules
- wargames
- scenarios
- threats
- responses

This chamber answers:
- what craft exists
- what doctrine assets it contains
- what heuristics and protocols it provides
- when it is admissible

#### 2.4 War Gaming / Affair
Function: game one obligation.

Affair runtime features:
- inherited doctrine from source-map
- plan objectives
- uncertainty
- time horizon
- lineage node
- actor type
- selected craft
- selected heuristics
- volatility exposure
- posture / positioning
- allies
- enemies
- entity mapping
- linked execution tasks

This chamber answers:
- why this affair exists
- what fragility it removes
- what means it requires
- what the next move is

#### 2.5 War Gaming / Interest
Function: game one option.

Interest runtime features:
- hypothesis
- downside
- evidence note
- expiry date
- max loss percent
- hedge percent
- edge percent
- irreversibility
- protocol checks
- linked execution tasks
- doctrine inheritance from source-map

This chamber answers:
- what convexity exists
- what downside is capped
- what evidence supports the option
- what can be explored safely

#### 2.6 War Gaming / Lineage
Function: inspect exposure across survival layers.

Runtime-backed lineage model:
- lineage nodes
- lineage entities
- lineage risks
- actor types
- domain exposure
- volatility exposure
- linked affairs
- linked interests
- risk register

Current lineage ladder:
- self
- family
- state
- nation
- humanity
- nature

Lineage scales:
- stakes
- risk meaning
- blast radius
- hedge requirement
- no-ruin posture

#### 2.7 War Gaming / Mission
Function: inspect hierarchy, dependencies, and sequencing.

Runtime-backed concepts:
- mission graph
- mission hierarchy
- dependency chain
- readiness
- no-ruin constraints
- serial vs parallel flows
- mission-linked doctrine cautions

This chamber answers:
- what must happen first
- what depends on what
- what cannot be risked

### 3. Mission Command
Function: organize affairs into hierarchy.

Mission Command is the obligation layer above local chambers.

Current runtime-backed features:
- mission risk heatgrid
- serial vs parallel flow lanes
- tier focus
- mission bottlenecks
- recovery playbooks
- virtue spiral
- do-now copilot
- protocol status
- confidence evidence
- absorbing barrier awareness
- unresolved affair checks

Mission Command doctrine:
- remove fragility first
- absorbing barriers first
- only then expand optionality

### 4. Vision Command
Function: organize interests into hierarchy.

In the current codebase, the interests surface is the working option layer.

Runtime-backed features:
- interest list and filters
- domain filter
- source filter
- lineage filter
- scope filter
- doctrine context inherited from source-map
- open lab action
- open portfolio action
- open War Gaming action

This surface manages:
- optionality stacks
- domain-linked opportunities
- scope and perspective
- doctrine-linked edge and avoid posture

### 5. Surgical Execution
Function: execute task chains.

KHAL turns affairs, interests, plans, and preparation into tasks.

Runtime-backed execution concepts:
- tasks
- task status
- due dates
- horizons
- source type
- source id
- execution chain
- scheduling onto timeline

Execution belongs downstream of doctrine and command, not above them.

### 6. Dashboard
Function: global system telemetry.

Dashboard is the place for cross-system artifacts, not local doctrine.

Current runtime-backed dashboard features:
- global quadrant heatgrid
- global source volatility flow
- fragility radar
- task kill chain
- stakes triad
- global barbell guardrail
- asymmetry curve
- execution split
- optionality budget
- via negativa queue
- black swan readiness
- execution distribution
- strategic posture filter
- global source register
- operator signal

Dashboard should host global visuals only.

## Supporting systems

### Lab
Function: experimental lifecycle for interests.

Current lab stages:
- `FORGE`
- `WIELD`
- `TINKER`

Lab runtime features:
- interest ordering by asymmetry score
- protocol checks
- barbell rebalance
- inherited doctrine from source-map
- hypothesis scaffolding
- kill criteria
- expiry date
- evidence notes
- downside framing
- linked execution tasks
- stage advancement gates

Lab answers:
- is this option ready to be forged
- is it ready to be wielded
- is it ready to be tinkered with safely

### Drafts
Function: prose-first structural thinking editor.

Drafts bridges:
- raw thought
- inferred structure
- promoted runtime entities

Current runtime-backed drafts concepts:
- durable drafts
- draft title and raw text
- inferred structure
- structural anchors
- draft entity links
- promotion events
- selected anchor
- anchor state
- debug inspector

Supported anchor outcomes:
- affair
- interest
- craft
- stack
- rule
- heuristic
- scenario
- threat
- response

Drafts exists so the user can think in prose and still land in structured KHAL entities.

### Portfolio War Room
Function: command layer above bets.

Canonical route:
- `/missionCommand/portfolio`

Compatibility alias:
- `/portfolio`

Portfolio runtime features:
- portfolio projects
- strategic role
- stage
- signal band
- bottleneck
- ship log
- experiment
- evidence
- decision gate
- cemetery / lessons
- role and stage filters
- commander board

Strategic project roles:
- core
- option
- probe
- archive
- killed

Stages:
- idea
- framing
- build
- shipping
- traction
- stalled
- archived

Portfolio is above bets, not a duplicate of interests.

### Time Horizon
Function: temporal planning and mortality-aware scheduling.

Runtime features:
- focus text / north star
- birth date
- life expectancy
- rings canvas
- deadlines
- scheduled tasks
- unscheduled tasks
- horizon placement
- ICS calendar feed

Time Horizon ties execution to time and mortality, not just backlog.

### Lineage Map
Function: inspect exposure by survival layer.

Runtime features:
- lineage tree
- actor filters
- selected lineage node summary
- domain exposure
- volatility exposure
- linked interests
- linked affairs
- lineage entities
- risk register

### Decision Modal and Decision Chamber
Function: protocol-heavy decision capture and plan structuring.

Decision Modal runtime concepts:
- staged war-game protocol
- target selection by mode
- objectives
- KPIs
- thresholds
- preparation notes
- context narrative
- fragility narrative
- means text
- ends text
- hedge text
- edge text
- risk reward summary
- concavity
- short vol / long vol
- exposure
- dependency
- irreversibility
- optionality
- response time
- omission cadence
- bets
- barrier rules
- checklist rules
- policy acknowledgements
- no ruin gate
- ergodicity gate
- metric limit gate
- jensen gate
- barbell gate

Decision Chamber runtime concepts:
- affair-centric planning
- inherited source doctrine
- plan objectives
- uncertainty
- time horizon
- craft and heuristic selection
- craft traces through heaps/models/frameworks/barbells
- strategy posture
- strategy positioning
- allies
- enemies
- execution task creation

These surfaces capture more detailed doctrine and planning logic than the lighter list views.

## Command grammar

### Affairs
Affairs are:
- defensive obligations
- hedge-dominant
- fragility-reducing
- hierarchy-friendly
- execution-producing

Affairs typically produce:
- plans
- means selection
- execution tasks
- mission hierarchy entries

### Interests
Interests are:
- exploratory options
- edge-dominant
- convexity-seeking
- downside-capped
- lab and portfolio friendly

Interests typically produce:
- experiments
- evidence loops
- kill criteria
- limited-risk execution tasks
- portfolio projects

## Visual and UX intent
The generated UI should reflect these rules.

### Non-negotiable principles
- form follows function
- show, don't tell
- the medium is the message
- narrative over dashboards
- speed over polish
- decision clarity in under 1 second
- every pixel must be earned

### Product feel
KHAL should feel like:
- a decision chamber
- a strategy operating system
- calm
- severe
- elegant
- local-first
- high-trust
- graph-aware
- ontology-aware
- less like SaaS, more like an operator instrument

### What to emphasize visually
- one dominant purpose per surface
- strong chamber hierarchy
- calm shell
- generous spacing
- graph or visual artifact when it clarifies structure instantly
- domain-specific consequence structure
- local vs global separation

### What to avoid visually
- dashboard clutter
- card spam
- verbose helper text
- long warning walls
- excessive progress bureaucracy
- generic admin-console feel
- decorative visuals with no decision meaning

## Surface contracts

### War Room contract
Should show:
- sources
- domains
- crafts

Should feel like:
- ontology
- orientation
- current landscape

Should not feel like:
- planning
- telemetry overload
- execution dashboard

### War Gaming contract
Should show:
- consequence structure
- simulation pressure
- downstream branching

Should feel like:
- gaming the decision
- testing posture
- proving whether an affair or interest is justified

Should not feel like:
- a form wall
- a dashboard shell
- project tracking

### Mission Command contract
Should show:
- hierarchy
- dependencies
- obligation sequencing

Should feel like:
- command
- triage
- no-ruin ordering

### Vision Command contract
Should show:
- options
- opportunity structure
- exploratory hierarchy

Should feel like:
- optionality management
- disciplined exploration

### Dashboard contract
Should show:
- global telemetry
- only strong visuals

Should feel like:
- system-level signal

Should not feel like:
- local decision chamber

## Short description for design/image models
KHAL is a dark, elegant, local-first decision operating system. The product is organized around War Room, War Gaming, Mission Command, Vision Command, Surgical Execution, and Dashboard. It models reality through State of the Art and State of Affairs. State of the Art contains Map, Stone, Ends, and Means. Stone contains Skin in the Game and Philosopher's Stone. State of Affairs contains Affairs and Interests. Affairs are obligations that remove fragility. Interests are options that preserve convex upside. Supporting systems include Lab with Forge/Wield/Tinker stages, Drafts for prose-first structural thinking, Portfolio War Room for commanding multiple bets, Lineage Map for survival-scale exposure, and Time Horizon for mortality-aware scheduling. The UI should feel like a decision chamber, not a dashboard: calm, high-trust, graph-aware, visually restrained, with strong hierarchy and only earned elements on screen.
