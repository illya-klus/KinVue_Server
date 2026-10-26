## What to do

Scaffold `apps/gateway` on port 4000 with `GET /health/live`, `GET /health/ready`, `GET /metrics`, and shared JSON error responses. Gateway is the only HTTP entry point for the web app.

## Technical notes

- Service: `apps/gateway` port 4000; sole HTTP entry for web client
- Labels: backend, gateway

## Story points

3

## Depends on

KIN-22–KIN-26

## Acceptance criteria

- Meets Definition of Done for KinVue stories (tests pass, PR reviewed, no secrets committed)

## References

- 28_JIRA_BACKLOG.md
- 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md
