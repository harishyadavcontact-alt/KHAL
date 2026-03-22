# War Gaming / Source Chamber Implementation Brief

## Scope
This brief applies only to:
- `War Gaming / Source`

It does not authorize a full app redesign.
It does not authorize replacing KHAL doctrine with mock logic.
It does not authorize adding more navigation chrome.

The goal is:
- make `War Gaming / Source` feel like a real decision chamber
- keep KHAL's runtime-backed doctrine underneath
- selectively borrow the best structural and visual ideas from the provided reference

## Core job of the surface
`War Gaming / Source` must answer one question:

How does this source of volatility propagate into one selected domain, what posture follows, and what downstream Affair or Interest does it justify?

## Non-negotiable product principles
- form follows function
- show, don't tell
- the medium is the message
- narrative over dashboards
- speed over polish
- every pixel must be earned

## What the chamber must contain

### Required flow
1. source
2. affected domains
3. State of the Art
4. Scenario / Threat / Response
5. Generate

### Required doctrine inside State of the Art
- `Map`
  - decision type
  - tail behavior
  - quadrant
  - admissible posture
- `Stone`
  - `Skin in the Game`
    - stakes
    - risks
    - odds
    - repeat rate
    - base rate
    - trigger condition
    - lineage
    - players / fragilistas
  - `Philosopher's Stone`
    - fragility
    - vulnerabilities
    - non-linearity
    - propagation
- `Ends`
  - hedge
  - edge
- `Means`
  - craft
  - heuristics
  - avoid

### Required exit
- generate Affair from hedge
- generate Interest from edge

## Steal exactly
These parts from the reference are strong enough to adopt with minimal structural change.

### 1. Chamber header pattern
Use this structure:
- breadcrumb
- chamber title in `source -> domain` form
- compact meta pills

Target shape:
- breadcrumb: `War Gaming / Source Chamber`
- title: `Interest rate cycle -> Capital structure`
- pills:
  - tail character
  - ergodicity / non-ergodicity state
  - quadrant
  - posture

Why:
- immediate orientation
- strong visual hierarchy
- minimal text, high meaning density

### 2. Step flow pattern
Use a horizontal step flow directly under the chamber header.

Target sequence:
- `Source`
- `Domains`
- `State of the Art`
- `Scenario / Threat`
- `Generate`

Why:
- it makes process order legible
- it avoids long stacked sections
- it removes the need for warning walls and progress bureaucracy

### 3. Doctrine panel pattern
Use:
- thin rule
- small mono section label
- content below

Inside `Skin in the Game`, `odds` should not be a single vague note.
It should be supported by:
- odds profile
- repeat rate
- base rate
- trigger condition

This should replace card-heavy subsection wrappers wherever possible.

Why:
- calmer
- more editorial
- less box clutter
- supports doctrine reading order

### 4. Map classification grid
Use a 2x2 classification grid for `Map`.

Cells:
- decision type
- tail behavior
- quadrant
- admissible posture

Why:
- compact
- scannable
- strong classification snapshot

### 5. Stone split into two cards
Use exactly two doctrinal blocks:
- `Skin in the Game`
- `Philosopher's Stone`

Why:
- matches KHAL doctrine
- creates a strong consequence-centered visual core

### 6. Ends as barbell split
Use a two-sided barbell presentation:
- hedge on the left
- edge on the right

Why:
- this is the right visual metaphor
- makes downside vs optionality explicit instantly

### 7. Right aside concept
Use the aside only for stable, secondary context:
- active craft
- heuristics
- avoid
- lineage exposure

Why:
- it supports the chamber without competing with it

## Adapt for KHAL
These ideas are good, but must be translated into KHAL rather than copied literally.

### 1. Use KHAL data, not demo prose
The reference uses static narrative text. In KHAL, these sections must bind to:
- source map profiles
- State of the Art projection
- craft/runtime records
- lineage risks
- response logic

So:
- preserve the structure
- replace demo copy with runtime-backed content

### 2. Keep the current app shell
Do not import the full reference shell.

KHAL should keep:
- current left app shell
- current section routing

Only the inner source chamber should be rebuilt in this style.

### 3. Use chamber header pills carefully
The pills should show only high-signal regime facts.

Good candidates:
- tail class
- quadrant
- method posture
- no-ruin / barbell state

Bad candidates:
- generic readiness noise
- derived metrics with no direct operator meaning

### 4. Make step flow functional, not decorative
The step rail should drive the chamber.

Behavior:
- current step visible in main panel
- prior steps summarized, not fully expanded
- next steps available only when prerequisites are sufficient

Do not:
- show every phase in full at once
- force the user to scroll through the whole doctrine

### 5. Keep narrative, but compress it
The narrative paragraph style is good.

Use it only for:
- one high-signal framing statement per selected source-domain pair

Do not:
- add explanatory paragraphs everywhere

### 6. Translate the right aside into doctrine support
The aside should not become a second dashboard.

It should remain short and stable.

Allowed content:
- active craft
- 3-4 heuristics
- avoid list
- compact lineage exposure visualization

Not allowed:
- execution metrics
- global charts
- triage bureaucracy
- repeated summaries of the main panel

### 7. Keep real Scenario / Threat / Response
The reference uses collapsible scenario cards.
That pattern is good.

Use it for:
- scenario
- threat
- response

But bind it to actual KHAL doctrine chains and source-linked logic.

### 8. Keep Generate as a consequential exit
Generate should be the end of the chamber, not a floating CTA.

It should clearly show:
- what Affair will be created from hedge
- what Interest will be created from edge

## Do not steal
These parts should not be imported.

### 1. Full top navigation
Do not add a second full nav system above the existing KHAL shell.

Why:
- too much chrome
- weakens chamber focus

### 2. Multi-layer left rail complexity
Do not literally copy:
- chamber rail
- source list
- domain list
all stacked in the left rail if it creates navigation overload.

KHAL should stay lighter than the reference here.

### 3. Decorative demo content
Do not copy:
- fake rates examples
- fake labels
- fake status dots
- fake notifications

Only copy structural patterns.

### 4. Excessive light-theme commitment
Do not treat the light paper palette as the primary decision.

The real takeaway is:
- hierarchy
- typography
- editorial restraint

Not:
- switch the whole app to beige immediately

### 5. More UI furniture
Do not add:
- more banners
- more warnings
- more helper text
- more meta-panels

This brief is about reduction and concentration.

## Proposed KHAL source chamber structure

### Header
- breadcrumb
- `source -> domain` title
- 3-4 regime pills

### Step flow
- Source
- Domains
- State of the Art
- Scenario / Threat
- Generate

### Main panel
When `State of the Art` is active:
- viewing domain selector
- one short framing narrative
- `Map` classification grid
- `Stone` two-card split
- `Ends` barbell split

When `Scenario / Threat` is active:
- collapsible or stacked scenario cards
- each with response logic

When `Generate` is active:
- one `Affair` card from hedge
- one `Interest` card from edge

### Aside
- active craft
- heuristics
- avoid
- lineage exposure

## Pixel discipline for this chamber
Every visible block must answer one of these:
- where am I?
- what kind of world is this?
- what can break?
- what must be protected?
- what method is admissible?
- what downstream branch follows?

If a block does not answer one of those questions, cut it.

## Implementation order
1. replace current `War Gaming / Source` inner layout
2. keep routing and persistence unchanged
3. keep source-map save/generate behavior unchanged
4. rebind the new layout to existing doctrine/runtime fields
5. only after that, tune colors and spacing

## Success criteria
- user can understand the chamber in under 1 second
- no long stacked scroll through all phases
- no generic dashboard feeling
- clear `source -> domain -> doctrine -> scenario -> generate` progression
- chamber feels like a decision instrument, not a form wizard
