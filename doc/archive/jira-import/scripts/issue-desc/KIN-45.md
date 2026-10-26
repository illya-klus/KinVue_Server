## What to do

Add Prometheus (9090) and Grafana (3001) services to `infra/docker-compose.yml`. These give the team local metrics and dashboards before production observability is wired up.

## Technical notes

- Prometheus localhost:9090; Grafana localhost:3001
- Labels: infra, observability

## Story points

2

## Depends on

KIN-12

## Acceptance criteria

- Prometheus reachable at localhost:9090
- Grafana reachable at localhost:3001

## References

- 28_JIRA_BACKLOG.md
- 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md
