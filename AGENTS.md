Project: Khal

Goal:
Decision-making operating system.

Project Source of Truth:
`docs/product/Khal_genesis.md` is the canonical doctrine and product reference for this repository.

Runtime Authority:
Operator-scoped SQLite runtime (`data/operators/*.sqlite`) with `data/KHAL.sqlite` as the template/bootstrap database.

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
Narrative > dashboards.
Speed > polish.
