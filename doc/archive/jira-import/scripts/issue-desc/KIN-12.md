## Goal

End-to-end register and login flow through Gateway to Auth and Users, with E2E and failure tests.

## Scope

Register/login pages, error handling, E2E and Saga failure verification.

## Out of scope

Do not build profile, movies, or rooms UI in this epic.

## Suggested order

1. KIN-221: Build register page with validation (password min 12 chars)
2. KIN-222: Build login page + redirect to movie search
3. KIN-223: Handle duplicate email/username error messages
4. KIN-224: E2E: register → login → profile loads
5. KIN-225: Manual failure test: kill Users during registration, verify no false success

## References

- 28_JIRA_BACKLOG.md
