# Personal Operator Journey

Date: 2026-03-10

## Goal

Make KHAL usable immediately for a single operator who is both using the system and refining it over time.

## First-Run Browser Flow

1. Open `/`.
2. Redirect to `/home`.
3. If the operator is not onboarded, show a minimal intake screen.
4. Capture only:
   - name
   - date of birth
5. Redirect immediately to `/war-gaming/source?onboarding=1`.
6. In source war-gaming, prompt:
   - "First we need to war-game your sources of volatility."
7. Capture a list of volatility sources, one per line.
8. After sources are saved, focus the first created source and continue the decision flow.

## Source War-Gaming Sequence

1. List volatility sources.
2. Select one source.
3. Identify which domains that source touches.
4. For each domain, capture:
   - stakes
   - risks
   - fragility
   - hedge
   - edge
5. Convert the highest-pressure outputs into execution.

## UX Rules Applied

- Show, do not tell: the first screen has one job only.
- Form follows function: identity first, volatility mapping second.
- Decision clarity in under one second: no full dashboard before operator intake.
- Narrative over dashboard: the onboarding sequence explains what happens next in plain language.

## Current Readiness

- Build passes.
- Typecheck passes.
- Targeted route-contract and decision tests pass.
- The route smoke script still requires a live server on `http://localhost:3010`.

## Next Product Corrections

- Add a guided source-to-domain linking action directly inside source war-gaming.
- Make domain war-gaming progressively disclose fields instead of showing the full surface at once.
- Add an explicit "resume where I left off" action for daily personal use.
