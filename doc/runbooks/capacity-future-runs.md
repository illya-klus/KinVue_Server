# Post-MVP capacity runs (KIN-265)

MVP exit does **not** require:

- 40k concurrent WebSockets
- 11k QPS movie search sustained
- $300/mo budget spent on that scale

## Planned later

| Target | Tooling | When |
|--------|---------|------|
| 5k room sockets | `tests/load/rooms-websocket.js` (plan Step 31.6) | Staging with ≥2 Rooms instances |
| Search peak model | Horizontal Meilisearch only if NFR missed | After `capacity-results.md` shows gap |
| Chat fan-out | `tests/load/chat.js` | After Rooms chat load baseline |

Budget cap **$300/month** remains; provisioning stays in `mvp-cost-estimate.md`.
