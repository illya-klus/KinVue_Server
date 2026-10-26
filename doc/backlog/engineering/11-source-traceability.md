# Source traceability

## Documents analyzed

| Document                                                 | Used for                                                                                                            |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| 00_README.md                                             | Stage, principles, dual budget                                                                                      |
| 01_PRODUCT_OVERVIEW.md                                   | User and admin flows, ephemeral rooms, secondary chat                                                               |
| 02_REQUIREMENTS.md                                       | FR-01 through FR-37 and NFR-01 through NFR-15                                                                       |
| 03_CAPACITY_ESTIMATION.md                                | Load targets and the heartbeat contradiction                                                                        |
| 04_HIGH_LEVEL_ARCHITECTURE.md                            | Ingress, services, stores                                                                                           |
| 05_SERVICE_BOUNDARIES.md                                 | Ownership and rejected services                                                                                     |
| 06_AUTH_AND_REGISTRATION.md                              | JWT, saga, idempotency, unique email                                                                                |
| 07_USERS_AND_SOCIAL_GRAPH.md                             | MongoDB, friendships, optional projection                                                                           |
| 08_ROOMS_REALTIME_AND_CHAT.md                            | WebSocket, Redis, resync, chat                                                                                      |
| 09_MOVIE_SEARCH_AND_INDEXING.md                          | Search, publish, reconciliation                                                                                     |
| 10_MEDIA_UPLOAD_TRANSCODING_DELIVERY.md                  | Direct upload and HLS delivery                                                                                      |
| 11_NOTIFICATIONS_MESSAGING_RELIABILITY.md                | ACK, retry, DLQ, outbox                                                                                             |
| 12_DATA_OWNERSHIP_AND_CONSISTENCY.md                     | Sources of truth                                                                                                    |
| 13_DISTRIBUTED_SYSTEM_PATTERNS.md                        | Pattern checklist                                                                                                   |
| 14_FAILURE_AND_RECOVERY_NOTES.md                         | Failure tickets                                                                                                     |
| 15_SEQUENCE_DIAGRAMS.md                                  | Endpoint order                                                                                                      |
| 16_ARCHITECTURE_DECISIONS.md                             | ADR-001 through ADR-021                                                                                             |
| 17_DECISION_LOG.md                                       | Accepted, rejected, deferred                                                                                        |
| 18_OPEN_QUESTIONS_AND_DEFERRED_DECISIONS.md              | Decision tickets                                                                                                    |
| 19_IMPLEMENTATION_PLAN.md                                | Phase order                                                                                                         |
| 20_TESTING_AND_VALIDATION_PLAN.md                        | Test tickets                                                                                                        |
| 21_OBSERVABILITY_AND_METRICS.md                          | Metric tickets                                                                                                      |
| 22_SECURITY_MODEL.md                                     | Security tickets                                                                                                    |
| 23_DATA_MODELS_DRAFT.md                                  | Schema tickets                                                                                                      |
| 24_SCALING_AND_DEPLOYMENT_STRATEGY.md                    | MVP versus target scale                                                                                             |
| 25_RISKS_AND_TRADEOFFS.md                                | Risk notes in decision tickets                                                                                      |
| 26_GLOSSARY.md                                           | Vocabulary only                                                                                                     |
| 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md              | File layout, ports, endpoint bodies, phase steps                                                                    |
| manifest.json                                            | Confirms the original 27-file pack                                                                                  |
| 28_JIRA_BACKLOG.md                                       | Prior coarse breakdown, not a second product                                                                        |
| scripts/issue-desc, all 148 files KIN-11 through KIN-158 | Second-pass read. Scrambled duplicate of document 28. No new requirement. Ticket set not expanded from these files. |

## Requirement coverage

Every FR-01 through FR-37 and NFR-01 through NFR-15 appears on at least one ticket. FR-09 appears only as a deferral. NFR-01 appears on the post-MVP capacity plan and the hosting decision, not as an MVP load-pass ticket. NFR-07 is recorded as having no numeric target.

## ADR coverage

ADR-001 through ADR-021 are the constraints on ingress, local JWT, Redis rooms, ephemeral chat, PostgreSQL movies, deferred search cache, vertical search first, media bypass, no streaming service, multipart upload, transcode queue, registration saga, global user id, friendship collection, at-least-once notifications, outbox, cron reconciliation, and deferred failure deep-dives. Tickets that would violate a rejected ADR were not created.

## Prior backlog

`28_JIRA_BACKLOG.md` has 23 epics and 115 stories measured in multi-day story points. This backlog replaces that granularity for local import. Ids are `T-####` so they do not collide with `KIN-*` keys that may already exist in an external project. This pass did not read or update any external board.

## Confidence legend

A ticket's source line is the evidence. If the source is only document 27's "fixed decisions" and document 18 still has the question open, confidence is Proposed. If a screen in document 27 cannot function without an endpoint the API list omitted, confidence is Inferred.
