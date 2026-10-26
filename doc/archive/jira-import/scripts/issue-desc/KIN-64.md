## What to do

Scaffold `apps/notifications-service` on port 4005 with health, readiness, and metrics. It consumes RabbitMQ events and stores in-app notifications.

## Technical notes

- Service: `apps/notifications-service` port 4005; RabbitMQ amqp://localhost:5672, management UI localhost:15672
- Labels: backend, notifications

## Story points

2

## Depends on

KIN-22–KIN-26

## Acceptance criteria

- Meets Definition of Done for KinVue stories (tests pass, PR reviewed, no secrets committed)

## References

- 28_JIRA_BACKLOG.md
- 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md
