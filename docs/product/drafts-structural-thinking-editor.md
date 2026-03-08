# Drafts: Prose-First Structural Thinking

## One-line definition
Drafts is a prose-first, structure-aware thinking environment inside KHAL. It lets the user think in plain English while the system detects structural anchors that can later be promoted into durable KHAL entities.

## Product role inside KHAL
Drafts is not a code editor, schema form, or JSON debugger.

Drafts exists to bridge:
- raw thought
- human-readable decision structure
- compile-readable persistence

The visible surface must prioritize human readability. Agent-readable and compile-readable forms exist, but stay internal or optional.

## Doctrine
- SQLite (`data/KHAL.sqlite`) remains the runtime source of truth.
- `Genesis.xlsx` remains archival/reference-only unless an explicit migration decision is made.
- Narrative clarity matters more than dashboard density.
- Map-first architecture remains intact.
- RRFI, Laws, scenario logic, and existing hierarchy are constraints, not optional flavor.

## Core interaction model
### Writing canvas
The main surface is a calm drafting canvas.

The user writes:
- prose
- fragments
- partial lists
- scenario thoughts
- directives
- rough judgments

The user should never need to learn a DSL to use Drafts.

### Structural anchors
Structural anchors are the intermediate layer between free prose and fully promoted entities.

Anchors are:
- visible
- source-linked
- revisable
- keyboard-friendly
- human-readable
- dismissible

Supported anchor types:
- entity anchor
- grouping anchor
- directive anchor
- judgment anchor
- dependency anchor
- weak-link anchor
- lineage anchor

Typical anchor outcomes:
- interest
- affair
- craft
- stack
- rule
- heuristic
- scenario
- threat
- response

### Structure panel
The structure panel replaces raw JSON in the main UI.

It should surface:
- detected affairs
- detected interests
- detected crafts
- candidate stacks
- candidate rules
- candidate heuristics
- scenarios, threats, and responses
- linked existing entities
- open structural questions
- weak links supported by the inferred structure

### Debug inspector
Tri-readable internal data may be exposed only through an optional inspector.

That inspector is for development and verification, not the default experience.

## Structural inference behavior
Drafts must tolerate:
- incomplete thought
- ambiguous grouping
- rough language
- reordering
- block fragments
- imperfect naming

The inference model should behave probabilistically and conservatively.

Phase-1 inference cues:
- imperative language -> likely rule or protocol
- grouped reinforcing items -> likely stack
- judgment language -> likely heuristic
- scenario language -> likely scenario or wargame
- threat language -> likely threat
- response language -> likely response or hedge
- hierarchy hints -> likely affair or lineage requirement

## Weak-link doctrine
Weak-link warnings must only appear when supported by the actual inferred structure.

Current supported warnings:
- detected interest with no parent affair
- high-leverage factors with no protocol or guardrail
- important stack with no governing rule
- craft-like thinking with heuristics but no protocol
- scenario language without explicit threat surface
- threat language without response path

## Promotion model
Promotion preserves source prose and provenance.

Current implementation:
- direct promotion is live for `affair` and `interest`
- other anchor types can still be accepted and tracked as draft-only links
- compile-readable payload remains available behind the inspector and API

## Current limitations
This rebuild is intentionally honest about backend maturity.

Current limitations:
- no durable `drafts` table yet
- no persisted `structural_anchors` table yet
- only partial promotion into canonical runtime entities
- existing-entity linking is heuristic and UI-side
- inference is deterministic heuristics, not full semantic modeling

## Why this direction fits KHAL
Drafts now aligns with KHAL because it:
- keeps the human-readable layer primary
- respects the affairs -> interests -> robustness/convexity doctrine
- fits the knowledge primitives already added for crafts, stacks, protocols, rules, heuristics, wargames, scenarios, threats, and responses
- supports scenario logic without turning the editor into a pseudo-language surface
- can scale into tiles, maps, and richer persistence later

## Extension points
Highest-leverage next steps:
1. Add durable `drafts`, `draft_blocks`, `structural_anchors`, and `promotion_events` tables in SQLite.
2. Promote additional anchor types into knowledge primitives through canonical APIs.
3. Add map-aware anchor linking so drafts can target domains, laws, and lineage nodes explicitly.
4. Add ambiguity review workflows for uncertain anchors.
5. Add richer block-level provenance and side-by-side promotion review.
