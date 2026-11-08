# Capacity results (MVP local)

KIN-274 / Phase 31.17. **Not** proof of 100k CCU — local scripts only.

| Script | Date | Environment | RPS / QPS | p50 | p95 | p99 | Notes |
|--------|------|---------------|-----------|-----|-----|-----|-------|
| `tests/load/gateway-authenticated-api.mjs` | _run locally_ | dev laptop + Gateway :4000 | — | — | — | — | Requires `LOAD_JWT`, stack up |
| `tests/load/movie-search.mjs` | _run locally_ | Gateway + Meilisearch | — | — | — | — | Paper model 3.6k avg / 7–11k peak is architecture, not this run |
| `tests/load/media-upload-transcode.mjs` | _run locally_ | queue depth only | — | — | — | — | Fixture jobs, not 20 GB files |

## NFR-07

No numeric budget assigned yet (per plan). This file records measurements only.

## Decisions (Phase 31.18–31.19)

- No horizontal Meilisearch cluster unless measured p95 misses NFR after vertical scale.
- No Redis search cache unless hit-rate metrics justify it.

## Future larger runs (KIN-265)

5k WebSocket sockets and 40k-socket paper model are **post-MVP**. See `capacity-future-runs.md`.
