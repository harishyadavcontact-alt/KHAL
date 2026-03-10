# UI Usability Benchmark

Date: 2026-03-10

Scope:
- static benchmark of the current UI structure and route intent
- centered on the project rule: user gains decision clarity in under 1 second
- meant to guide refactoring and future feature work

Important note:
- this benchmark is based on repository structure, route contracts, and current component wiring
- it is not yet an instrumented live-session benchmark
- a runtime pass should follow after the current refactor lands

Design doctrine for this benchmark:
- show don't tell
- form follows function
- decision clarity before decoration
- each war-gaming mode should look and behave like a distinct decision instrument, not a relabeled generic form

## Benchmark Model

Each surface is scored from 1 to 5 on:
- Time to Orientation: can a user tell where they are immediately
- Decision Clarity: does the page expose an obvious next action
- Navigation Coherence: do labels and routes match the system ontology
- Cognitive Load: is the information density manageable
- Actionability: can a user move from reading to doing without friction

Overall score:
- 5.0 = excellent
- 4.0 to 4.9 = strong
- 3.0 to 3.9 = workable, but friction is noticeable
- below 3.0 = likely to slow decision-making

## Current Benchmark

### `/home`
- Time to Orientation: 4.5
- Decision Clarity: 4.0
- Navigation Coherence: 4.5
- Cognitive Load: 4.4
- Actionability: 4.3
- Overall: 4.3
- Notes: strong as a gateway; benefits from unified section copy and route prefetch

### `/dashboard`
- Time to Orientation: 4.0
- Decision Clarity: 3.8
- Navigation Coherence: 4.0
- Cognitive Load: 3.4
- Actionability: 4.0
- Overall: 3.8
- Notes: high-value operational page, but the metric surface risks overload if not grouped aggressively around “what to do now”

### `/war-room`
- Time to Orientation: 3.9
- Decision Clarity: 3.6
- Navigation Coherence: 4.1
- Cognitive Load: 3.5
- Actionability: 3.7
- Overall: 3.8
- Notes: ontology is present, but section-to-action conversion should stay sharper

### `/war-gaming/domain`
- Time to Orientation: 3.8
- Decision Clarity: 4.1
- Navigation Coherence: 3.7
- Cognitive Load: 3.2
- Actionability: 4.2
- Overall: 3.8
- Notes: conceptually strong, but route/mode semantics were duplicated in code before the registry refactor

### `/affairs`
- Time to Orientation: 4.2
- Decision Clarity: 4.1
- Navigation Coherence: 4.2
- Cognitive Load: 3.8
- Actionability: 4.3
- Overall: 4.1
- Notes: likely one of the cleaner lanes because the doctrine is simpler: obligation -> action

### `/interests`
- Time to Orientation: 4.0
- Decision Clarity: 3.8
- Navigation Coherence: 4.1
- Cognitive Load: 3.6
- Actionability: 4.0
- Overall: 3.9
- Notes: optionality lane is understandable, but protocol readiness must stay visible or users will confuse ideas with executable bets

### `/missionCommand`
- Time to Orientation: 3.9
- Decision Clarity: 3.8
- Navigation Coherence: 4.0
- Cognitive Load: 3.5
- Actionability: 4.1
- Overall: 3.9
- Notes: command surface is strategically important; hierarchy should always dominate decoration

### `/surgical-execution`
- Time to Orientation: 4.2
- Decision Clarity: 4.4
- Navigation Coherence: 4.1
- Cognitive Load: 3.9
- Actionability: 4.6
- Overall: 4.2
- Notes: strongest direct-action surface in the system

## System-Level Findings

Strengths:
- the ontology is distinct enough that sections do not feel generic
- the route system is broad and maps well to the product concept
- Affairs, Interests, Mission Command, and Surgical Execution have clear product identities

Usability risks:
- section identity and route semantics were duplicated across multiple files
- duplicated structural knowledge increases the chance that UI labels, deep links, and decision-tree logic drift apart
- some surfaces carry enough information density that “clarity in under one second” is at risk without stronger visual prioritization

## Practical Targets

For the next iteration, use these targets:

1. Orientation target
- page title, section identity, and current mode visible within first viewport

2. Decision target
- every major surface must expose one obvious primary next action above the fold

3. Navigation target
- one canonical name per section
- one canonical route per section
- compatibility aliases remain hidden implementation detail

4. Density target
- no more than three competing priority blocks above the fold on core operational pages

5. Transition target
- every page should make it obvious where to go next: War Room -> War Gaming -> Mission Command -> Surgical Execution

6. Show-don't-tell target
- if a concept can be shown with state, shape, sequence, or status, prefer that over explanatory paragraph text
- explanatory copy should answer: what am I looking at, what matters, what do I do next

7. Form-follows-function target
- Affairs war-gaming should foreground thresholds, preparation, and execution chain
- Interests war-gaming should foreground hypothesis, max loss, expiry, kill criteria, and evidence
- Domain war-gaming should foreground posture, fragility, and hedge/edge balance
- Mission war-gaming should foreground dependency integrity and no-ruin constraints

## Operational Benchmarking Plan

Use this sequence for live benchmarking after refactor verification:

1. Run route smoke:
- `npm --workspace @khal/web run smoke:routes`

2. Run perf smoke:
- `npm --workspace @khal/web run perf:smoke`

3. Walk the core routes manually:
- `/home`
- `/dashboard`
- `/war-room`
- `/war-gaming/domain`
- `/affairs`
- `/interests`
- `/missionCommand`
- `/surgical-execution`

4. Record for each route:
- time to identify purpose
- time to identify next action
- number of clicks to reach a decision or execution step
- whether labels match ontology and route naming

## Refactor Impact on Usability

The new registry refactor improves usability indirectly by making the system more coherent:
- shared section naming reduces navigation drift
- shared war-gaming mode definitions reduce decision-tree drift
- future UI changes can now preserve route and doctrine consistency more reliably

The current theme/token refactor improves usability more directly:
- shared semantic tokens reduce light/dark leakage across surfaces
- stronger rule lines and editor-like panels improve scan clarity
- the UI can shift themes without changing the product grammar of the page

## Minimal UI Testing

Keep the UI testing stack minimal:
- route smoke for breakage
- typecheck for component contract drift
- one focused visual-theme regression test for token/provider behavior
- short manual checklist across core routes in both light and dark themes

Avoid heavier screenshot or Storybook infrastructure for now unless the UI starts changing fast enough that manual theme checks stop being reliable.

## Next Benchmark Pass

After runtime verification, the next benchmark should add:
- actual route timings from smoke/perf artifacts
- task-based walkthrough timings
- screenshot-based above-the-fold clarity scoring
