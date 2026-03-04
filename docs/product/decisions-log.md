# Decisions Log

- Runtime: Web + local API
- Tooling: npm workspaces + Turborepo
- Source-of-truth policy (v0.3): SQLite is the runtime and strategic authority.
- Excel policy (v0.3): `Genesis.xlsx` is retained as archival/reference material only.
- Runtime strategy: local SQLite reads/writes for speed, offline execution, and deterministic API behavior.
- Product doctrine: Affairs reduce fragility; Interests increase convexity; Mission Command orders execution.
- Visual doctrine: prioritize sub-second clarity with operational visuals over dashboard bloat.
- API style: REST
- Testing baseline: unit + parser + API-level coverage
