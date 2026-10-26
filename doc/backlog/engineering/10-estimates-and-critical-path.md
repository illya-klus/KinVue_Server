# Estimates and critical path

## Totals

| Slice                    | Tickets | Hours |
| ------------------------ | ------: | ----: |
| All                      |     308 |   775 |
| MVP                      |     307 |   772 |
| Post-MVP                 |       1 |     3 |
| Longest dependency chain |      34 |    85 |

Uncertainty is about ±35% (504 to 1046 hours) until E-00 is accepted. The wide part of the range is the movie state model, the Rooms outbox store, transcoding integration, and whatever hosting the cost worksheet allows. Decision tickets are short. Waiting on a product owner is calendar time and is not included in the hours.

## By priority

| Priority | Tickets | Hours |
| -------- | ------: | ----: |
| P0       |     228 |   584 |
| P1       |      69 |   169 |
| P2       |      11 |    22 |
| P3       |       0 |     0 |

## By confidence

| Confidence | Tickets |
| ---------- | ------: |
| Confirmed  |     182 |
| Inferred   |       3 |
| Proposed   |     123 |

Confirmed means the behavior is in the requirements, an ADR, or a sequence diagram. Inferred means a confirmed screen or operation cannot exist without the ticket, and the pack does not spell the endpoint or procedure out. Proposed means the implementation plan or this backlog suggests a value that document 18 still lists as open.

## By epic

| Epic                                              | Tickets | Hours |
| ------------------------------------------------- | ------: | ----: |
| E-00 Decision gates                               |      25 |    33 |
| E-01 Workstation and repository bootstrap         |       5 |     5 |
| E-02 Monorepo foundation                          |       6 |    11 |
| E-03 Local infrastructure                         |      11 |    22 |
| E-04 Shared packages                              |       7 |    22 |
| E-05 Service skeletons                            |      22 |    51 |
| E-06 Auth data model                              |       5 |     9 |
| E-07 Auth token lifecycle                         |       9 |    22 |
| E-08 Registration saga                            |       7 |    19 |
| E-09 Users data model                             |       4 |    10 |
| E-10 Profiles and user search                     |       4 |    11 |
| E-11 Friendships                                  |       8 |    20 |
| E-12 API gateway                                  |      10 |    26 |
| E-13 Web application shell                        |       8 |    19 |
| E-14 Registration and login UI                    |       3 |     8 |
| E-15 Profile and social UI                        |       4 |    11 |
| E-16 Movie data model                             |       5 |    10 |
| E-17 Movie catalog API                            |       8 |    19 |
| E-18 Search projection                            |       6 |    18 |
| E-19 Watchlist                                    |       3 |     5 |
| E-20 Movie web experience                         |       5 |    14 |
| E-21 Rooms control API                            |      10 |    27 |
| E-22 Rooms realtime session                       |       5 |    16 |
| E-23 Playback synchronization                     |       4 |    14 |
| E-24 Room chat and reactions                      |       3 |     9 |
| E-25 Room web experience                          |       6 |    18 |
| E-26 Notifications                                |       8 |    22 |
| E-27 Direct media upload                          |       6 |    19 |
| E-28 Transcoding                                  |       5 |    15 |
| E-29 Signed media playback                        |       3 |     8 |
| E-30 Scheduled watch sessions                     |       5 |    16 |
| E-31 Observability                                |      12 |    32 |
| E-32 Security hardening                           |       7 |    18 |
| E-33 CI pipeline                                  |       3 |    10 |
| E-34 End-to-end journeys                          |      21 |    62 |
| E-35 Failure and recovery tests                   |      12 |    36 |
| E-36 Load and capacity validation                 |       6 |    19 |
| E-37 MVP deployment and operations                |      14 |    42 |
| E-38 Documentation refresh and release acceptance |      13 |    27 |

## Critical path

The chain below is the longest dependency path, 85 hours if every other chain is staffed at the same time. It is not a quote for one person. One person follows the 775 hours total.

1. T-0001 Accept the v1 stack, repository layout, and port map (2h, depends on nothing)
2. T-0026 Install and verify Node.js 20 LTS (1h, depends on T-0001)
3. T-0027 Install and verify pnpm (1h, depends on T-0026)
4. T-0031 Create the root package manifest and workspace scripts (2h, depends on T-0027, T-0030)
5. T-0032 Declare the pnpm workspace globs (1h, depends on T-0031)
6. T-0037 Create the Compose project and private network (2h, depends on T-0028, T-0032)
7. T-0044 Add MinIO and create the kinvue-media bucket (3h, depends on T-0037, T-0017)
8. T-0046 Publish the local environment example and port map (2h, depends on T-0038, T-0039, T-0040, T-0041, T-0042, T-0043, T-0044)
9. T-0048 Create the shared config package with Zod validation (3h, depends on T-0034, T-0032, T-0046)
10. T-0058 Boot the auth service process (2h, depends on T-0048, T-0049, T-0033)
11. T-0077 Add Auth PostgreSQL migration tooling (2h, depends on T-0058, T-0038)
12. T-0138 Add Movie PostgreSQL migration tooling (2h, depends on T-0064, T-0039, T-0077)
13. T-0139 Create the movies table from the accepted state model (3h, depends on T-0138, T-0013)
14. T-0143 Implement movie repository reads and writes (3h, depends on T-0139, T-0142)
15. T-0144 Implement admin movie creation as a draft (2h, depends on T-0143, T-0052)
16. T-0202 Authorize a direct multipart upload after metadata exists (4h, depends on T-0201, T-0140, T-0144)
17. T-0203 Complete the multipart upload and enqueue transcoding (3h, depends on T-0202, T-0042)
18. T-0207 Declare the media.transcode queue and job contract (2h, depends on T-0203, T-0074)
19. T-0208 Generate the HLS ladder and write it back to object storage (4h, depends on T-0207, T-0075, T-0017)
20. T-0209 Mark a movie READY only after the HLS master exists (3h, depends on T-0208, T-0139)
21. T-0212 Return a short-lived signed HLS URL (3h, depends on T-0209, T-0017, T-0201)
22. T-0119 Proxy watchlist, room control, and media-access routes (3h, depends on T-0115, T-0157, T-0166, T-0168, T-0172, T-0212)
23. T-0186 Start a solo watch or create a private or public room (3h, depends on T-0163, T-0166, T-0119)
24. T-0252 E2E create a private room (3h, depends on T-0186, T-0248)
25. T-0253 E2E invited friend joins a private room (3h, depends on T-0188, T-0252, T-0247)
26. T-0255 E2E grant controller permission (3h, depends on T-0189, T-0253)
27. T-0256 E2E synchronized play, pause, and seek (3h, depends on T-0190, T-0255)
28. T-0258 E2E room chat (3h, depends on T-0191, T-0256)
29. T-0259 E2E room reaction (3h, depends on T-0191, T-0258)
30. T-0263 Run the full local end-to-end journey suite (2h, depends on T-0243, T-0244, T-0245, T-0246, T-0247, T-0248, T-0249, T-0250, T-0251, T-0252, T-0253, T-0254, T-0255, T-0256, T-0257, T-0258, T-0259, T-0260, T-0261, T-0262)
31. T-0305 Run the automated acceptance commands (2h, depends on T-0242, T-0263, T-0281)
32. T-0306 Walk the product acceptance checklist (4h, depends on T-0305, T-0262, T-0261, T-0219, T-0237)
33. T-0307 Check metrics, dashboards, request ids, secrets, and CI (2h, depends on T-0306, T-0231, T-0238, T-0295)
34. T-0308 Tag the MVP release after acceptance passes (1h, depends on T-0307, T-0304, T-0302)

## Blocking edges

626 prerequisites are recorded. A ticket with dependencies must not start implementation until those ids are done or explicitly waived. Decision tickets block the code that would otherwise guess.

## What is not on the critical path

Web visual polish beyond the documented screens, the larger-than-local load plan, documentation refresh of the original pack, and the post-MVP paper-scale run can slip without moving the first solo-playback demo. They cannot slip past the documented MVP tag if the definition of done still includes them. Scheduling is in the MVP checklist but is not on the longest chain if rooms and media are already the long pole.
