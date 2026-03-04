Project: Khal

Goal:
Decision-making operating system.

Single Source of Truth:
SQLite runtime database (`data/KHAL.sqlite`).
Excel (`Genesis.xlsx`) is archival/reference only.

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
