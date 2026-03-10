# Agent Log Protocol

Purpose:
- preserve working context across agent sessions
- keep a dated record of code changes, product decisions, open questions, and verification state
- reduce repeated repo re-discovery when work resumes

## Operating Rule

Every agent session that changes code or updates product direction should:

1. Read:
- `TERMINAL_HANDOFF.md`
- the latest monthly log under `docs/agent-log/`

2. Append a dated entry to the active monthly log:
- format: `YYYY-MM-DD HH:MM TZ`
- include:
  - branch/base commit
  - what changed
  - what was verified
  - what remains unstable
  - next recommended move

3. Update `TERMINAL_HANDOFF.md` when the recommended next move changes materially.

## Why This Path

There is no guaranteed external hook that can auto-edit the repository whenever a new agent starts.
The most reliable in-repo mechanism is:

- one canonical handoff file for immediate context
- one append-only dated work log for session history

This keeps the project shippable and makes session continuity deterministic.
