PROJECT_CONTEXT.md

KHAL is a browser-based decision operating system over a SQLite runtime.

Simple product model:
- `War Room` helps the user think through one domain.
- `Mission Command` aggregates `Affairs` into hierarchy.
- `Vision Command` aggregates `Interests` into hierarchy.

Surface model:
- `War Room` = see the decision
- `War Gaming` = game the decision
- `Mission Command` = organize affairs
- `Vision Command` = organize interests
- `Dashboard` = global system telemetry

Core loop:
- `State of the Art`
  - `Skin in the Game`
  - `Philosopher's Stone`
  - `Ends`
  - `Means`
- `State of Affairs`
  - `Affairs`
  - `Interests`

Operational doctrine:
- Volatility and causal opacity set the operating condition.
- Harm is treated as the most reliable signal.
- Affairs reduce fragility and move toward robustness.
- Interests add convex optionality and move beyond robustness.

Primary user capabilities:
- inspect a domain through `State of the Art`
- inspect a domain through `State of Affairs`
- create and manage affairs
- create and manage interests
- aggregate affairs in Mission Command
- aggregate interests in Vision Command
- queue surgical execution tasks

UI / UX principles:
- `Form follows function`
- `Show, don't tell`
- `The medium is the message`

Data model policy:
- SQLite is the operational and strategic source of truth.
- `Genesis.xlsx` is retained as historical reference only.

End goal:
- a decision system that gives the user clarity in under one second.
