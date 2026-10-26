## Goal

Harden KinVue against common attacks: validation, CORS, rate limits, CI scanning, security tests.

## Scope

Body limits, CORS allowlist, secret/dependency scanning, security test suite, security runbook.

## Out of scope

Do not add new features — hardening only.

## Suggested order

1. KIN-621: Input validation + body size limits on all external endpoints
2. KIN-622: CORS allowlist, secret scanning, dependency scanning in CI
3. KIN-623: Security tests: private room denial, viewer playback denial, admin guard, expired JWT, upload type denial
4. KIN-624: Write `docs/runbooks/security.md`

## References

- 28_JIRA_BACKLOG.md
