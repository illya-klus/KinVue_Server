## What to do

Extend `infra/docker-compose.yml` with MongoDB (27017), Redis (6379), RabbitMQ (5672/15672), Meilisearch (7700), and MinIO (9000/9001). KinVue depends on all of these for users, rooms, search, messaging, and media.

## Technical notes

- Service: `apps/movie-service` port 4003; DB postgresql://localhost:5434; Meilisearch http://localhost:7700
- Service: `apps/rooms-service` HTTP 4004, WS ws://localhost:4014/rooms; Redis `redis://localhost:6379`
- Service: `apps/notifications-service` port 4005; RabbitMQ amqp://localhost:5672, management UI localhost:15672
- Object storage: MinIO localhost:9000, bucket `kinvue-media`, console localhost:9001
- Labels: infra

## Story points

3

## Depends on

KIN-11

## Acceptance criteria

- `pnpm infra:up` starts all containers
- RabbitMQ UI at localhost:15672
- MinIO console at localhost:9001
- Meilisearch /health returns OK

## References

- 28_JIRA_BACKLOG.md
- 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md
