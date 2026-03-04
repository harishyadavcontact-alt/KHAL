# Decisions Log

- Runtime: Web + local API
- Tooling: npm workspaces + Turborepo
- Source-of-truth policy (v0.3): SQLite is the runtime and strategic authority.
- Excel policy (v0.3): `Genesis.xlsx` is retained as archival/reference material only.
- Runtime strategy: local SQLite reads/writes for speed, offline execution, and deterministic API behavior.
- Product doctrine: Affairs reduce fragility; Interests increase convexity; Mission Command orders execution.
- Lab doctrine (v0.4.1): Interests are treated as experiments with Forge -> Wield -> Tinker lifecycle and hard protocol gate before execution.
- Ranking doctrine (v0.4.1): Asymmetry Score is the primary ordering signal for Lab experiments.
- Fractal War Gaming doctrine (v0.4.2): each war-gaming mode has mode-specific grammar (`source`, `domain`, `affair`, `interest`, `craft`, `lineage`, `mission`) under one macro hierarchy.
- Hybrid role flow (v0.4.2): Missionary (dependency-first stricter gating) and Visionary (jump allowed with deterministic warnings).
- Visual doctrine: prioritize sub-second clarity with operational visuals over dashboard bloat.
- API style: REST
- Testing baseline: unit + parser + API-level coverage
