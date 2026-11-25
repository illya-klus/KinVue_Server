# Sprint 7 Release Acceptance — 2026-11-23

This is an updated, partial acceptance record. The MVP release gate is **not clear**; do not create or push `v0.1.0-mvp` while a required scenario remains unverified or failed. Evidence below comes from local backend integration checks and disposable GitHub Actions stacks; it is not a production deployment or full media acceptance.

## Automated checks

| Check                          | Result  | Evidence / limitation                                                                                                                                             |
| ------------------------------ | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Server format                  | PASS    | `pnpm format:check`.                                                                                                                                              |
| Server lint                    | PASS    | `pnpm lint`; zero errors and three existing warnings in the logger interceptor.                                                                                   |
| Server typecheck               | PASS    | `pnpm typecheck`.                                                                                                                                                 |
| Server tests                   | PASS    | `pnpm test`; Auth registration saga integration passed (7 checks); Rooms tests passed (7 suites / 32 tests).                                                      |
| Rooms realtime integration     | PASS    | Redis-backed integration passed (1/1): viewer playback command rejected without version change; role update/reconnect/chat behavior exercised.                    |
| Rooms infrastructure readiness | PASS    | `pnpm test:integration:infra`; KinVue Postgres/Redis were checked with a Compose override to avoid unrelated host ports; Rooms `/health/ready` passed.            |
| Client lint and typecheck      | PASS    | `pnpm lint`, `pnpm exec tsc --noEmit`.                                                                                                                            |
| Client smoke E2E               | PASS    | Client PR #14, CI run [45179977017](https://github.com/illya-klus/KinVue_Client/actions/runs/45179977017), smoke job.                                             |
| Client live Rooms E2E          | PASS    | Same CI run, `live-auth` job; disposable Auth/Movie/Gateway/Rooms stack and Playwright journey completed successfully.                                            |
| Load smoke                     | NOT RUN | No bounded Gateway/search load report has been produced.                                                                                                          |
| Local MinIO                    | BLOCKED | Pulled local image contains zero-byte entrypoint/binary and fails with `exec format error`; media object checks could not run. No user data volumes were removed. |

## Product acceptance (steps 34.10–34.33)

| Step        | Scenario                                                | Result                                                                                                                                                                                                                                  |
| ----------- | ------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 34.10       | Register, login, refresh, logout                        | PARTIAL — live registration and login passed for three isolated users; refresh and logout were not exercised in the browser journey.                                                                                                    |
| 34.11–34.13 | Profile, user search, friend requests                   | NOT RUN — no live client journeys for these flows in this acceptance run.                                                                                                                                                               |
| 34.14       | Admin movie create, edit, publish, schedule             | NOT RUN — no live admin movie journey.                                                                                                                                                                                                  |
| 34.15       | Movie search and detail                                 | PARTIAL — live UI search and fixture detail navigation passed; broader catalog acceptance remains unverified.                                                                                                                           |
| 34.16       | Add/remove watchlist                                    | NOT RUN — no live watchlist journey.                                                                                                                                                                                                    |
| 34.17       | Solo playback                                           | NOT RUN — Movie does not yet expose `POST /api/movies/:id/media-access`; the player cannot obtain a signed HLS URL from the live stack.                                                                                                 |
| 34.18       | Private invite join                                     | PASS — owner creates a private room; invited user joins as VIEWER; a separate authenticated user without a valid invite receives HTTP 403. Client PRs #13/#14, run 45179977017.                                                         |
| 34.19       | Public room join                                        | PASS — a second authenticated user discovers and joins the public room from the client UI. Same run.                                                                                                                                    |
| 34.20       | Owner closes room                                       | PARTIAL — test cleanup deletes its rooms through Gateway API; closing through the owner UI was not verified.                                                                                                                            |
| 34.21–34.25 | Roles, playback control/sync, reconnect                 | PARTIAL — owner changes VIEWER to CONTROLLER, the controller can play, the owner receives the state, and a viewer command is rejected with no version increment. Browser reconnect and all remaining playback cases were not exercised. |
| 34.26–34.28 | Chat delivery, duplicate message ID, reactions          | PARTIAL — covered by Rooms realtime server integration checks, not by the browser acceptance journey.                                                                                                                                   |
| 34.29       | Notifications                                           | NOT RUN — no live notification journey.                                                                                                                                                                                                 |
| 34.30–34.32 | Multipart upload, transcode output, signed HLS playback | NOT RUN — MinIO image is broken locally and there is no media fixture for a live HLS run.                                                                                                                                               |
| 34.33       | Application services do not serve media bytes           | NOT RUN as a runtime acceptance check. The architecture requirement remains: video bytes come directly from private object storage/CDN; app services handle control-plane requests.                                                     |

FR-09 activity is deferred by [decision 0014](../decisions/0014-defer-fr09-activity.md); it is not counted as passed.

## Operational acceptance (steps 34.34–34.38)

| Step  | Scenario                               | Result                                                                                                                                                                 |
| ----- | -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 34.34 | Metrics endpoints respond              | PASS — PR #65 Compose CI checks `/metrics` on Gateway, Auth, Movie, Notification, User, Room, and the transcode worker; Prometheus reports all seven services healthy. |
| 34.35 | Three Grafana dashboards open          | PASS — PR #65 Compose CI verifies `kinvue-overview`, `kinvue-rooms`, and `kinvue-media` through Grafana's API.                                                         |
| 34.36 | Sample service log contains request ID | NOT RUN — CI verifies request-ID propagation in response headers but does not inspect a runtime service log sample.                                                    |
| 34.37 | No committed private signing key       | PASS — PR #65 secret scan and Compose key-material check passed; no signing key is stored in the repository.                                                           |
| 34.38 | CI passes                              | PASS for the merged scope — Server PR #64, Client PR #14, and this Server PR #65 checks passed. This does not replace remaining product acceptance.                    |

## Remaining acceptance work

1. Implement and verify Movie media access, private HLS delivery, and a playable fixture; restore a valid local MinIO image or use an approved disposable test image.
2. Add live journeys for solo playback, profile, users/friends, admin catalog, watchlist, notifications, owner UI close, chat/reactions, and reconnect.
3. Run bounded load checks, all metrics endpoints, Grafana dashboards, and a runtime request-ID log sample.
4. Reassess the release tag only after every required checklist item has an explicit pass/fail result and no required item is unverified.
