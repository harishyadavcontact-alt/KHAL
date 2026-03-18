# Decisions Log

- Runtime: Web + local API
- Tooling: npm workspaces + Turborepo
- Source-of-truth policy (v0.6): `docs/product/Khal_genesis.md` is the canonical product doctrine and repository source of truth.
- Runtime authority policy (v0.6): operator-scoped SQLite is the runtime data authority, with `data/KHAL.sqlite` as the bootstrap/template DB.
- Excel policy (v0.6): `Genesis.xlsx` is retained as archival/reference material only and must not be opened unless explicitly requested.
- Runtime strategy: local SQLite reads/writes for speed, offline execution, and deterministic API behavior.
- Product doctrine: Affairs reduce fragility; Interests increase convexity; Mission Command orders execution.
- Lab doctrine (v0.4.1): Interests are treated as experiments with Forge -> Wield -> Tinker lifecycle and hard protocol gate before execution.
- Ranking doctrine (v0.4.1): Asymmetry Score is the primary ordering signal for Lab experiments.
- Fractal War Gaming doctrine (v0.4.2): each war-gaming mode has mode-specific grammar (`source`, `domain`, `affair`, `interest`, `craft`, `lineage`, `mission`) under one macro hierarchy.
- Hybrid role flow (v0.4.2): Missionary (dependency-first stricter gating) and Visionary (jump allowed with deterministic warnings).
- Visual doctrine: prioritize sub-second clarity with operational visuals over dashboard bloat.
- Triage doctrine (v0.4.5-R1): blocked states must produce deterministic, exact block-to-fix suggestions; no model dependence.
- Quick action doctrine (v0.4.5-R1): one-click fixes are whitelisted, minimal, idempotent where possible, and never bypass no-ruin.
- Drafts doctrine (v0.5 planning): Drafts is a prose-first, structure-aware thinking environment; structural anchors are the visible bridge between raw prose and compile-readable persistence.
- Portfolio doctrine (v0.5): Portfolio War Room lives under Mission Command as the command surface above bets; it remains distinct from Interests and only supports an optional primary Interest link in v1.
- API style: REST
- Testing baseline: unit + parser + API-level coverage
