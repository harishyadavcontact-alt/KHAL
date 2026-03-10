# State-of-the-Art Alignment

Date: 2026-03-10

## Thesis Intent

KHAL is not a dashboard. It is a rigorous decision-making operating system for uncertainty.

The operator should become:

- judicious
- expeditious
- robust against ruin
- selectively exposed to convex upside

## Current Doctrine Already Present In Repo

- War Room is the authoritative ontology.
- War Gaming is the planning layer.
- Affairs are obligations that remove fragility and move the operator toward robustness.
- Interests are options that increase convexity and move the operator beyond robustness.
- Mission aggregates affairs and interests into executable hierarchy.

## Main Alignment Finding

The current implementation already has the right macro skeleton, but State of the Art is still too compressed.

Right now the product mostly behaves like:

1. source
2. domain
3. affair or interest
4. craft
5. lineage
6. mission

Your thesis requires State of the Art to be expanded into a stricter sequence:

1. Map
2. Philosopher's Stone
3. Ends
4. Means
5. State of Affairs
6. Mission

That is the major product correction.

## Proposed State-of-the-Art Flow

### 1. Map

Purpose:
Classify the decision environment before asking for plans, bets, or actions.

Minimum fields:

- source of volatility
- decision type
  - simple / binary (`M0`)
  - payoff-sensitive / complex (`M1+`)
- domain tail class
  - thin-tailed / Mediocristan
  - fat-tailed / Extremistan
  - unknown, treated as Extremistan for safety
- resulting quadrant
  - Q1, Q2, Q3, Q4
- method posture
  - statistical confidence acceptable
  - bounded inference only
  - precaution / no-ruin first
  - tail clipping / exposure reduction

Output:
A map of what kind of reasoning is admissible.

### 2. Philosopher's Stone

Purpose:
Translate the mapped situation into consequence structure.

Minimum fields:

- stakes
- risks
- skin in the game / asymmetry
- players / fragilista mapping when relevant
- lineage exposure
- vulnerability
- fragility / robustness / antifragility posture
- nonlinearity
  - short volatility / concavity
  - robust
  - long volatility / convexity

Output:
A structural diagnosis of harm, upside, and propagation.

### 3. Ends

Purpose:
Force an explicit barbell posture.

Minimum fields:

- hedge
- edge
- hedge ratio / edge ratio
- what fragility the hedge removes
- what optionality the edge buys

Output:
An ends posture, not just narrative intent.

### 4. Means

Purpose:
Determine what methods, heuristics, architectures, and crafts are admissible given the mapped quadrant and the chosen barbell.

Minimum fields:

- craft
- method set
- heuristics
- architectures
- disallowed methods

Output:
A reusable means stack.

### 5. State of Affairs

Purpose:
Split obligations from options after the structural diagnosis is complete.

Outputs:

- affairs
  - obligation
  - urgent
  - fragility-removing
  - preparation-heavy
- interests
  - optional
  - speculative
  - convex
  - protocol-gated

### 6. Mission

Purpose:
Aggregate affairs and interests into hierarchy and sequence.

Output:

- mission hierarchy
- dependency order
- execution sequence
- no-ruin mission gate

## Product Consequences

The current `source -> domain` flow should not remain purely descriptive.

The first state-of-the-art interaction should become:

1. identify source of volatility
2. classify decision type
3. classify domain tail type
4. infer quadrant
5. recommend method posture

Only after this should the product move into stakes, risks, fragility, ends, and means.

## Recommended Product Change

Add a dedicated subflow under source war-gaming:

- `Map`
- `Stone`
- `Ends`
- `Means`

Then branch to:

- `Affair WarGame`
- `Interest WarGame`

This preserves your doctrine that war-gaming an affair is not the same as war-gaming an interest.

## Blind Spots To Resolve

1. Domain currently mixes two meanings:
   - semantic domain such as finance / health / legal / social
   - probabilistic domain class such as thin-tailed / fat-tailed

   These should not be the same field.

2. Quadrant classification needs an explicit rule:
   - user-selected
   - system-recommended
   - or both

3. Unknown probabilistic structure should default to the safer class.

4. The app needs a distinction between:
   - source of volatility
   - semantic domain touched
   - probabilistic domain class
   - decision class

5. Ends and means are currently spread across domain and craft surfaces; your thesis implies they should be first-class parts of State of the Art.

## Data Architecture Note

The runtime now supports:

- product template DB: `data/KHAL.sqlite`
- operator runtime DBs: `data/operators/<operator-slug>.sqlite`

That split is a better fit for the product direction because it separates doctrine/template state from real operator state.

## Next Build Step

Before larger UI changes, define the canonical state-of-the-art schema:

- volatility source
- semantic domain
- decision class
- probabilistic domain class
- quadrant
- method posture
- stakes
- risks
- lineage at threat
- fragility posture
- hedge
- edge
- heuristics
- craft
- resulting affairs
- resulting interests
