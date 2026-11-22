# Sprint 7 Release Acceptance — 2026-11-21

This is a partial acceptance record for the local Windows workspace. The MVP acceptance gate is **not clear**: product integration journeys and the full service stack were not available. Do not create or push `v0.1.0-mvp` while any required item is unverified or failed.

## Automated checks

| Check                               | Result         | Evidence / limitation                                                                                                                                                                                                                                                                                                                                       |
| ----------------------------------- | -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Server format                       | PASS           | `pnpm format:check` — all files formatted.                                                                                                                                                                                                                                                                                                                  |
| Server lint                         | FAIL           | `pnpm lint` — `typescript-eslint` 8.64.0 throws `Cannot read properties of undefined (reading 'Cjs')` under TypeScript 7 before linting source.                                                                                                                                                                                                             |
| Server typecheck                    | PASS           | `pnpm typecheck` — passed in the pre-commit hook for the documentation change.                                                                                                                                                                                                                                                                              |
| Server unit and scripted auth tests | PASS           | `pnpm test` — all package/service suites and the Auth registration integration suite completed successfully.                                                                                                                                                                                                                                                |
| Server build                        | PASS           | `pnpm build` — all 15 workspace projects built.                                                                                                                                                                                                                                                                                                             |
| Local integration infrastructure    | LIMITED PASS   | `pnpm test:integration:infra` initially timed out. It passed after starting the Compose Meilisearch and RabbitMQ containers. The helper checks TCP 5432, which was already occupied by the unrelated `skillswap_db` container; this is not proof that KinVue PostgreSQL was available. KinVue Meilisearch/RabbitMQ containers were stopped after the check. |
| Browser E2E                         | LIMITED PASS   | `pnpm test:e2e` — homepage passed; 10 service journeys were skipped because `E2E_STACK=1` and test credentials/services were not configured. Playwright Chromium was installed locally to run this check.                                                                                                                                                   |
| Client lint                         | PASS           | `pnpm lint`.                                                                                                                                                                                                                                                                                                                                                |
| Client typecheck                    | PASS after fix | `pnpm exec tsc --noEmit` passed after fixing optional credential narrowing in `e2e/notifications-friend-room.spec.ts` (Client PR #2).                                                                                                                                                                                                                       |
| Load smoke                          | NOT RUN        | `pnpm load:gateway` requires a live Gateway and `LOAD_JWT`; `pnpm load:search` requires a live Gateway and Movie/Search stack. No KinVue services were running.                                                                                                                                                                                             |

## CI

- Server PR #28: code-quality and compose-health checks passed.
- Server PR #29: code-quality and compose-health checks passed at the last check.
- Client PR #2: smoke check was pending at the last check.

## Product acceptance (steps 34.10–34.33)

| Step        | Scenario                                                | Result                                                                                                                                                          |
| ----------- | ------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 34.10       | Register, login, refresh, logout                        | NOT RUN — full stack and browser credentials unavailable.                                                                                                       |
| 34.11       | View and edit profile                                   | NOT RUN — service journey skipped.                                                                                                                              |
| 34.12       | User search                                             | NOT RUN — service journey skipped.                                                                                                                              |
| 34.13       | Friend request, accept, reject, list                    | NOT RUN — service journey skipped.                                                                                                                              |
| 34.14       | Admin movie create, edit, publish, schedule             | NOT RUN — service journey skipped.                                                                                                                              |
| 34.15       | Movie search and detail                                 | NOT RUN — service journey skipped.                                                                                                                              |
| 34.16       | Add/remove watchlist                                    | NOT RUN — service journey skipped.                                                                                                                              |
| 34.17       | Solo playback                                           | NOT RUN — no end-to-end run against services.                                                                                                                   |
| 34.18–34.19 | Private invite join and public room join                | NOT RUN — no complete invite/join service flow.                                                                                                                 |
| 34.20       | Owner closes room                                       | NOT RUN in product UI; server behavior has separate PR #28 checks.                                                                                              |
| 34.21–34.25 | Role permissions, playback controls/sync, reconnect     | NOT RUN — full realtime stack unavailable.                                                                                                                      |
| 34.26–34.28 | Chat delivery, duplicate message ID, reactions          | NOT RUN — full realtime stack unavailable.                                                                                                                      |
| 34.29       | Notifications                                           | NOT RUN — service journey skipped.                                                                                                                              |
| 34.30–34.32 | Multipart upload, transcode output, signed HLS playback | NOT RUN — media infrastructure and fixtures unavailable.                                                                                                        |
| 34.33       | Application services do not serve media bytes           | NOT RUN as a runtime acceptance check. Architecture requirement remains in force: clients fetch media from storage/CDN, while services handle control requests. |

FR-09 activity is deferred by [decision 0014](../decisions/0014-defer-fr09-activity.md); it is not counted as passed.

## Operational acceptance (steps 34.34–34.38)

| Step  | Scenario                               | Result                                                                                                                                              |
| ----- | -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| 34.34 | Metrics endpoints respond              | NOT RUN — no KinVue service processes were listening.                                                                                               |
| 34.35 | Three Grafana dashboards open          | NOT RUN — dashboard definitions exist, but Grafana was not running. Names are listed in [observability](../design/21_OBSERVABILITY_AND_METRICS.md). |
| 34.36 | Sample service log contains request ID | NOT RUN as a runtime sample. Logger unit test passed.                                                                                               |
| 34.37 | No committed private signing key       | PASS — searched tracked files for PKCS#8, RSA, EC, and OpenSSH private-key markers (excluding this report); no matches.                             |
| 34.38 | CI passes                              | PARTIAL — Server PR #28 and #29 checks passed; Client PR #2 smoke was pending.                                                                      |

## Next acceptance work

1. Resolve the TypeScript 7 ESLint compatibility failure or record a supported CI exclusion with a separate decision.
2. Start the KinVue infrastructure and all services with their own database ports, then run integration, full E2E journeys, and a bounded load smoke.
3. Complete and record every product and operational scenario above; rerun Client PR #2 CI.
4. Reassess release tag eligibility only after the full record has no failed or unverified acceptance steps.
