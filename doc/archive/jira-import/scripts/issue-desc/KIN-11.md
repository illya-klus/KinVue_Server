## Goal

Scaffold the React/Vite client with routing, Gateway-only API client, auth state, and shared UI patterns.

## Scope

`apps/web` shell, protected/admin routes, auth refresh, Playwright homepage smoke test.

## Out of scope

Do not build feature pages (register form, room player) — foundation only.

## Suggested order

1. KIN-211: Create Vite React TS app with routing shell
2. KIN-212: Build API client (Gateway-only HTTP) + auth state store
3. KIN-213: Implement auto refresh on 401 + logout flow
4. KIN-214: Add protected and admin route wrappers
5. KIN-215: Add shared UI states: loading, empty, error, unauthorized, forbidden
6. KIN-216: Playwright smoke test: homepage loads

## References

- 28_JIRA_BACKLOG.md
