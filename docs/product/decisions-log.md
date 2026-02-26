# Decisions Log

- Runtime: Web + local API
- Tooling: npm workspaces + Turborepo
- Storage strategy pivot: SQLite as runtime source-of-truth (`data/KHAL.sqlite`)
- Excel strategy: interoperability only (import/export), not runtime authority
- API style: REST
- Testing baseline: unit + parser + API-level coverage
