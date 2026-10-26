## Goal

Automated quality gate on every PR: lint, typecheck, unit/integration tests, Playwright smoke.

## Scope

GitHub Actions workflow, Docker Compose in CI, artifact upload on failure.

## Out of scope

Do not deploy to production in this epic — CI only.

## Suggested order

1. KIN-631: GitHub Actions: install, lint, typecheck, unit tests
2. KIN-632: CI: Docker Compose integration tests + Playwright smoke
3. KIN-633: Upload test artifacts on CI failure

## References

- 28_JIRA_BACKLOG.md
