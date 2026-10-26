## What to do

Expose `GET /.well-known/jwks.json` from auth-service (port 4001). Gateway and rooms-service cache these public keys for local JWT verification.

## Technical notes

- Labels: backend, auth

## Story points

2

## Depends on

KIN-121

## Acceptance criteria

- Meets Definition of Done for KinVue stories (tests pass, PR reviewed, no secrets committed)

## References

- 28_JIRA_BACKLOG.md
- 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md
