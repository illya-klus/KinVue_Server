# Testing and quality

No tests exist in the repository today. The testing plan is a list of scenarios. This backlog turns those scenarios into tickets that sit next to the feature they prove.

## By layer

| Layer       | Where it is required                                                                                                                                                                                              |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Unit        | Config, logger redaction, error codes, JWT failures, password hashing, token claims, playback position math, friendship pair normalization                                                                        |
| Migration   | Auth, Movie, watchlist, notification, and schedule schemas on an empty database                                                                                                                                   |
| Integration | Registration saga, friendships, outbox publish, search checkpoint, room HTTP, WebSocket access, two-instance pause, upload, transcode fixture, notification ACK and DLQ                                           |
| Component   | Web forms, guards, debounce, player control rules                                                                                                                                                                 |
| End to end  | The twenty journeys in Phase 29, then one command that runs them                                                                                                                                                  |
| Failure     | Gateway restart, Auth restart with a live JWT, Users down during registration, email race, Rooms kill, Redis loss note, Pub/Sub gap, Meilisearch down, RabbitMQ down, consumer crash, worker kill, partial upload |
| Load        | Local Gateway, local search, 1,000 room sockets, fixture transcode queue. Paper-scale load is post-MVP                                                                                                            |
| Security    | Private join denial, viewer control denial, admin denial, expired JWT, bad upload type, internal routes absent from the Gateway                                                                                   |

## Rules already fixed by the architecture

- Search tests must show that a Meilisearch failure does not roll back PostgreSQL and that the checkpoint does not advance.
- Registration tests must show that a lost Users response is safe to retry and that 201 is withheld.
- Playback tests must allow last-processed-wins. They must not require a lock.
- Chat tests must show that the same message id does not appear twice.
- Notification tests must show redelivery and dedup.
- Media tests must show that bytes do not pass through Gateway or Movie Service.
- NFR-07 has no numeric drift budget. Do not fail a test against an invented millisecond value. NFR-04 is 200 ms for room event propagation and NFR-05 is 500 ms for chat, and those are what the load notes compare.

## Quality gates before the tag

Format, lint, typecheck, unit, integration, end-to-end, the selected load smoke, the product checklist, metrics, dashboards, request ids, a secret scan, and green CI.
