# Sprint 7 Release Acceptance — 2026-11-22

This is an updated, partial acceptance record for the Server repository. The MVP acceptance gate is **not clear**. Keep release tag `v0.1.0-mvp` blocked until every required command and product scenario is verified.

## Automated commands

| Command / check                  | Result                  | Recorded output or limitation                                                                                                                                                                                                                                         |
| -------------------------------- | ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm format:check`              | PASS in CI              | [PR #44 code-quality-check](https://github.com/illya-klus/KinVue_Server/actions/runs/45032519707) passed, including formatting.                                                                                                                                       |
| `pnpm lint`                      | FAIL / excluded from CI | The current TypeScript 7 and `typescript-eslint` 8.64.0 combination crashes before linting (`Cannot read properties of undefined (reading 'Cjs')`). The CI workflow explicitly skips this step.                                                                       |
| `pnpm typecheck`                 | PASS                    | Full monorepo typecheck passed in the local commit hook for PR #44 and in [PR #44 code-quality-check](https://github.com/illya-klus/KinVue_Server/actions/runs/45032519707).                                                                                          |
| `pnpm test`                      | PASS in CI              | The full workspace unit-test step passed in [PR #44 code-quality-check](https://github.com/illya-klus/KinVue_Server/actions/runs/45032519707). Local Auth registration suite: 13 tests passed.                                                                        |
| Rooms scheduled-room integration | PASS in CI              | [PR #42 compose-health](https://github.com/illya-klus/KinVue_Server/actions/runs/45031728002): 3 PostgreSQL + Redis integration tests passed, covering rollback on Redis failure, invites/outbox publication, and cancelled schedules.                                |
| `pnpm test:integration:infra`    | NOT RUN locally         | Docker Desktop daemon was unavailable in this workspace. The CI compose-health job started the KinVue data plane and Rooms service successfully.                                                                                                                      |
| `pnpm test:e2e`                  | BLOCKED                 | The command delegates to `KinVue_Client`, which is not present beside this repository in the workspace yet. The browser E2E record from 2026-11-21 reported one homepage smoke pass and 10 service journeys skipped because no E2E stack/credentials were configured. |
| `pnpm load:gateway`              | NOT RUN                 | Requires a live Gateway and a valid `LOAD_JWT`; neither was available.                                                                                                                                                                                                |
| `pnpm load:search`               | NOT RUN                 | Requires a live Gateway and Movie/Search stack; neither was available.                                                                                                                                                                                                |
| Full CI                          | PASS                    | Security scans, code-quality, and compose-health checks passed for [PR #44](https://github.com/illya-klus/KinVue_Server/pull/44).                                                                                                                                     |

## Product acceptance (steps 34.10–34.33)

Not verified in this run. Registration and account journeys, movie flows, browser playback, room UI, realtime controls/chat, notifications, and signed media playback need the Client repository and a configured full-stack environment. FR-09 activity remains deferred under [decision 0014](../decisions/0014-defer-fr09-activity.md); it is not counted as passed.

## Operational acceptance (steps 34.34–34.38)

| Step  | Scenario                               | Result                                                          |
| ----- | -------------------------------------- | --------------------------------------------------------------- |
| 34.34 | Metrics endpoints respond              | NOT RUN against live services.                                  |
| 34.35 | Three Grafana dashboards open          | NOT RUN; Grafana was not running.                               |
| 34.36 | Sample service log contains request ID | NOT RUN as a runtime sample.                                    |
| 34.37 | No committed private signing key       | NOT RECHECKED in this run.                                      |
| 34.38 | CI passes                              | PASS for PR #44; product E2E and load checks remain unverified. |

## Remaining acceptance work

1. Restore a supported lint configuration or TypeScript toolchain and rerun `pnpm lint`.
2. Add the Client repository beside Server, configure E2E credentials/services, and rerun all browser journeys.
3. Start the full stack, run both bounded load smoke commands, and capture metrics/log evidence.
4. Complete operational and product scenarios, then reassess the release gate. Do not tag or push `v0.1.0-mvp` while any required item remains failed or unverified.

## Same-day update — Client tests available

The Client repository is now present beside Server. The full command `pnpm test:e2e` in KinVue_Client completed with **8 passed and 10 skipped**. Passing scenarios include the homepage, paginated user flows, scheduled room creation/list/cancel, public room navigation, room member roles/presence, invite-link creation, and invite acceptance. The service journeys remain skipped because `E2E_STACK=1`, test credentials, and the live service stack are unavailable. The new room and schedule journeys stub Gateway responses, so they verify browser behavior and request shape only; they do not count as live product acceptance.

Additional Client checks on 2026-11-22: `pnpm lint` passed and `pnpm build` passed. Client PRs #3–#5 and Server PR #52 are merged. Their CI checks passed. This does not change the acceptance gate: live registration/profile, live room and WebSocket behavior, metrics, load checks, and product playback remain unverified.

The earlier `pnpm test:e2e` row above described the pre-Client workspace state and is superseded by this update. The current result is a partial pass with 10 skipped scenarios, not a full end-to-end pass.
