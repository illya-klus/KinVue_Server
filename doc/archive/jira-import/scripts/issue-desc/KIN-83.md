## What to do

Create `packages/logger` emitting structured JSON logs with fields `service`, `requestId`, `userId`, `route`, `durationMs`, and `error`. Consistent logs are required for debugging distributed flows like registration Saga and room sync.

## Technical notes

- Log fields: `service`, `requestId`, `userId`, `route`, `durationMs`, `error`
- Labels: backend, observability

## Story points

2

## Depends on

KIN-21

## Acceptance criteria

- See Definition of Done in 28_JIRA_BACKLOG.md

## References

- 28_JIRA_BACKLOG.md
- 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md
