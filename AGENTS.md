Project: Khal

Goal:
Decision-making operating system.

Agent Entry Protocol:
1. Read `docs/product/Khal_genesis.md` first.
2. Treat `docs/product/Khal_genesis.md` as the single source of truth for product doctrine, ontology, surface purpose, and operating sequence.
3. Use `README.md` only as a repository entrypoint and implementation map.
4. Use `docs/architecture/*` for implementation reality, not for doctrine arbitration.
5. Use `docs/product/*` only as downstream surface contracts unless the user explicitly asks for those docs.
6. Use `docs/reports/*` and generated artifacts as historical or analytical material, never as doctrine authority.
7. If any file conflicts with `docs/product/Khal_genesis.md`, `docs/product/Khal_genesis.md` wins unless the user explicitly instructs otherwise.

Project Source of Truth:
`docs/product/Khal_genesis.md` is the canonical doctrine and product reference for this repository.

Runtime Source of Truth:
SQLite-first runtime, with `data/KHAL.sqlite` as template DB and `data/operators/*.sqlite` as active operator DBs when selected.

Excel Access Policy:
Excel (`Genesis.xlsx`) is archival/reference only and must not be opened, parsed, inspected, or treated as authority unless the user explicitly asks for `Genesis.xlsx`.

Architecture Philosophy:
- War Room = authoritative ontology
- War Gaming = planning layer
- Surgical Execution = task chain
- Mission Command = hierarchy

Core Model:
Affairs → obligations → remove fragility → robustness
Interests → options → convex payoff → beyond robustness

UI Principle:
User must gain decision clarity in <1 second.

Modes:
- Missionary Mode (Affairs)
- Visionary Mode (Interests)

Rules:
Never redesign Excel schema silently.
Never treat Excel as runtime authority without an explicit migration decision.
Never let downstream docs override `docs/product/Khal_genesis.md`.
Narrative > dashboards.
Speed > polish.
