# Sprint 7 Release Acceptance — 2026-11-22

This is an updated, partial acceptance record for the Server repository. The MVP acceptance gate is **not clear**. Keep release tag `v0.1.0-mvp` blocked until every required command and product scenario is verified.

## Automated commands

| Command / check                  | Result          | Recorded output or limitation                                                                                                                                                                                                                                                                                                                |
| -------------------------------- | --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm format:check`              | PASS in CI      | Passed in [PR #59 code-quality-check](https://github.com/illya-klus/KinVue_Server/actions/runs/45065779559) and [PR #60 code-quality-check](https://github.com/illya-klus/KinVue_Server/actions/runs/45065644841).                                                                                                                           |
| `pnpm lint`                      | PASS            | Fixed and restored in [PR #60](https://github.com/illya-klus/KinVue_Server/pull/60); zero errors, three non-blocking warnings locally. CI lint step passed.                                                                                                                                                                                  |
| `pnpm typecheck`                 | PASS            | Full monorepo typecheck passed locally and in [PR #59 code-quality-check](https://github.com/illya-klus/KinVue_Server/actions/runs/45065779559) and [PR #60 code-quality-check](https://github.com/illya-klus/KinVue_Server/actions/runs/45065644841).                                                                                       |
| `pnpm test`                      | PASS in CI      | Full workspace unit-test step passed in [PR #59 code-quality-check](https://github.com/illya-klus/KinVue_Server/actions/runs/45065779559) and [PR #60 code-quality-check](https://github.com/illya-klus/KinVue_Server/actions/runs/45065644841). Local Docker-backed registration integration could not run with the Windows daemon stopped. |
| Rooms scheduled-room integration | PASS in CI      | [PR #42 compose-health](https://github.com/illya-klus/KinVue_Server/actions/runs/45031728002): 3 PostgreSQL + Redis integration tests passed, covering rollback on Redis failure, invites/outbox publication, and cancelled schedules.                                                                                                       |
| `pnpm test:integration:infra`    | NOT RUN locally | Docker is unavailable locally. Its service-health coverage plus metrics, realtime regression, and scheduled-room PostgreSQL + Redis integration checks passed in [PR #59 compose-health](https://github.com/illya-klus/KinVue_Server/actions/runs/45065779605).                                                                              |
| `pnpm test:e2e`                  | PARTIAL PASS    | KinVue_Client run on 2026-11-22: 8 passed, 10 skipped. The 10 live-service journeys still need `E2E_STACK=1`, test credentials, and a running full stack; stubbed room flows are not live acceptance.                                                                                                                                        |
| `pnpm load:gateway`              | NOT RUN         | Requires a live Gateway and a valid `LOAD_JWT`; neither was available.                                                                                                                                                                                                                                                                       |
| `pnpm load:search`               | NOT RUN         | Requires a live Gateway and Movie/Search stack; neither was available.                                                                                                                                                                                                                                                                       |
| Full CI                          | PASS            | Security scans, code-quality, and compose-health passed for [PR #59](https://github.com/illya-klus/KinVue_Server/pull/59) and [PR #60](https://github.com/illya-klus/KinVue_Server/pull/60).                                                                                                                                                 |

## Product acceptance (steps 34.10–34.33)

Not verified in this run. Registration and account journeys, movie flows, browser playback, room UI, realtime controls/chat, notifications, and signed media playback need the Client repository and a configured full-stack environment. FR-09 activity remains deferred under [decision 0014](../decisions/0014-defer-fr09-activity.md); it is not counted as passed.

## Operational acceptance (steps 34.34–34.38)

| Step  | Scenario                               | Result                                                                                                                                                                                                            |
| ----- | -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 34.34 | Metrics endpoints respond              | PASS — five HTTP endpoints and Worker metrics respond; Prometheus reports all seven targets `up` in [PR #59 compose-health](https://github.com/illya-klus/KinVue_Server/actions/runs/45065779605).                |
| 34.35 | Three Grafana dashboards open          | PASS — `kinvue-overview`, `kinvue-rooms`, and `kinvue-media` APIs respond in [PR #59 compose-health](https://github.com/illya-klus/KinVue_Server/actions/runs/45065779605).                                       |
| 34.36 | Sample service log contains request ID | PASS — Gateway unit coverage captures the structured log with request ID; runtime response echoes a supplied ID in [PR #59 compose-health](https://github.com/illya-klus/KinVue_Server/actions/runs/45065779605). |
| 34.37 | No committed private signing key       | PASS — tracked-file scan and Gitleaks secret scan passed on the PR head.                                                                                                                                          |
| 34.38 | CI passes                              | PASS — Code Quality, Integration, secret scan, and dependency audit passed for [PR #59](https://github.com/illya-klus/KinVue_Server/pull/59).                                                                     |

### KIN-346 observability checklist

The Integration workflow exercises the running Compose stack and records each check as a required CI result:

- [x] Fetch `/metrics` from Auth, Gateway, Users, Movie, Rooms, Notifications, and Transcode Worker; confirm Prometheus reports all seven targets as `up`.
- [x] Query Grafana for the provisioned `kinvue-overview`, `kinvue-rooms`, and `kinvue-media` dashboards.
- [x] Send a request with a stable `x-request-id`; confirm the response echoes it. Gateway unit coverage captures a structured sample log and asserts that it includes the request ID.
- [x] Search tracked files for committed signing-key material; local scan returned no matches. CI Gitleaks secret scan passed on the PR head.
- [x] Confirm all CI and Integration checks pass before moving KIN-346 to Done.

PR: [#59 — observability acceptance](https://github.com/illya-klus/KinVue_Server/pull/59). The operational checklist passed. Product acceptance and load checks remain open, so this does not clear the full MVP release gate.

## Remaining acceptance work

1. Configure E2E credentials/services and rerun the 10 skipped live browser journeys.
2. Run both bounded load smoke commands against a live stack and capture metrics/log evidence.
3. Complete remaining product scenarios, then reassess the release gate. Do not tag or push `v0.1.0-mvp` while any required item remains failed or unverified.

## Same-day update — Client tests available

The Client repository is now present beside Server. The full command `pnpm test:e2e` in KinVue_Client completed with **8 passed and 10 skipped**. Passing scenarios include the homepage, paginated user flows, scheduled room creation/list/cancel, public room navigation, room member roles/presence, invite-link creation, and invite acceptance. The service journeys remain skipped because `E2E_STACK=1`, test credentials, and the live service stack are unavailable. The new room and schedule journeys stub Gateway responses, so they verify browser behavior and request shape only; they do not count as live product acceptance.

Additional Client checks on 2026-11-22: `pnpm lint` passed and `pnpm build` passed. Client PRs #3–#5 and Server PR #52 are merged. Their CI checks passed. This does not change the acceptance gate: live registration/profile, live room and WebSocket behavior, metrics, load checks, and product playback remain unverified.

The earlier `pnpm test:e2e` row above described the pre-Client workspace state and is superseded by this update. The current result is a partial pass with 10 skipped scenarios, not a full end-to-end pass.
