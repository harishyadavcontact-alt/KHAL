# API Contract (v0.1)

`GET /api/state`
Returns normalized state, dashboard summary (`doNow`, optionality, robustness), and sync status.

Mutation routes return persisted entity payloads and enforce conflict checks via workbook mtime.