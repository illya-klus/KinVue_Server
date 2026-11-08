# Gateway rate limits (edge)

Limits are enforced in `@kinvue/gateway` before proxying to upstream services. Responses use HTTP `429` and body `{ "error": "RATE_LIMITED", ... }`.

| Bucket          | Routes (examples)                               | Limit                    |
| --------------- | ----------------------------------------------- | ------------------------ |
| `login`         | `POST /api/auth/login`                          | 5 / minute / IP or user  |
| `register`      | `POST /api/auth/register`                       | 3 / minute / IP or user  |
| `search`        | `GET /api/movies/search`, `GET /api/movies/:id` | 60 / minute / IP or user |
| `rooms`         | `GET                                            | POST /api/rooms/*`       | 30 / minute / user |
| `authenticated` | Other authenticated APIs                        | 300 / minute / user      |

Identity: authenticated requests use `userId` from a valid JWT; otherwise `x-forwarded-for` or socket IP.

For local development, limits are in-memory per gateway process (not shared across replicas).
