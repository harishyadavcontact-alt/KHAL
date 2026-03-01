# Decisions Log

- Runtime: Web + local API
- Tooling: npm workspaces + Turborepo
- Source-of-truth policy: Excel remains canonical strategic ontology and schema authority.
- Runtime strategy: SQLite is the local operational cache/projection used for UI speed and offline writes.
- Sync policy: Excel <-> SQLite mapping layer is explicit; no silent Excel schema redesign.
- API style: REST
- Testing baseline: unit + parser + API-level coverage
