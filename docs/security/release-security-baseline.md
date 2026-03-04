# Release Security Baseline

## Security Gates
1. `npm audit --omit=dev --audit-level=high` must pass.
2. CodeQL workflow must complete without new critical findings.
3. Branch protections require CI + security checks before merge.

## Dependency Governance
- Dependabot is enabled weekly for npm and GitHub Actions.
- Security PRs must run full quality gate before merge.

## Secrets Hygiene
- Never commit plaintext tokens, credentials, or provider secrets.
- Use GitHub encrypted secrets for workflow runtime values.
- Secret scanning should remain enabled at the repository level.

## Doctrine Override Audit
- Overrides are exceptional and must include rationale.
- Override audit records are immutable and retained in SQLite.

## Release Stop Conditions
- Any high/critical vulnerability open in production dependency graph.
- Any failing security workflow in default branch.
