## Goal

Make KinVue operable with Prometheus metrics on every service and Grafana dashboards.

## Scope

HTTP + WS metrics, Prometheus scrape config, Overview/Rooms/Media dashboards, observability runbook.

## Out of scope

Do not change business logic — instrumentation and dashboards only.

## Suggested order

1. KIN-611: Prometheus metrics for all services (HTTP + Rooms WS metrics)
2. KIN-612: Grafana dashboards: Overview, Rooms, Media
3. KIN-613: Write `docs/runbooks/observability.md`

## References

- 28_JIRA_BACKLOG.md
