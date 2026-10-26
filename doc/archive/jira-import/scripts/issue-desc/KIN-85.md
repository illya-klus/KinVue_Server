## What to do

Create `packages/jwt` with an RS256 JWKS verification helper checking issuer, audience, expiration, and scopes. Gateway and rooms-service use this for local JWT validation without calling auth on every request.

## Technical notes

- RS256 verification; issuer `kinvue-auth`, audience `kinvue`
- Labels: backend, auth, security

## Story points

3

## Depends on

KIN-21

## Acceptance criteria

- See Definition of Done in 28_JIRA_BACKLOG.md

## References

- 28_JIRA_BACKLOG.md
- 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md
