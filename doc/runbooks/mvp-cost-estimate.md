# MVP monthly cost estimate (KIN-282)

Target: **≤ $300/month** hosting class per decision 0015. Numbers are **templates** — refresh with vendor quotes before spend.

| Line                          | Sizing (MVP)             | Est. USD/mo | Source / notes                             |
| ----------------------------- | ------------------------ | ----------- | ------------------------------------------ |
| Compute (1 small VPS or PaaS) | 2 vCPU, 4–8 GB RAM       | 20–40       | Gateway + workers or single node compose   |
| Auth PostgreSQL               | managed smallest         | 15–25       | e.g. Neon / RDS micro                      |
| Movie PostgreSQL              | managed smallest         | 15–25       | separate instance                          |
| Users MongoDB                 | M0 / shared              | 0–25        | Atlas free tier or smallest                |
| Redis                         | 1 GB HA plan             | 15–35       | **Required HA in prod** (G-14)             |
| RabbitMQ / AMQP               | managed small            | 20–40       | CloudAMQP or self on compute               |
| Object storage + egress       | 50 GB + CDN              | 10–30       | R2/S3 + CDN                                |
| Meilisearch                   | single small VM or cloud | 15–30       | Not multi-node for MVP                     |
| Observability                 | free / included          | 0–10        | Prometheus self-host or Grafana Cloud free |
| **Rough total**               |                          | **110–260** | Must re-sum before KIN-282 sign-off        |

If total **> $300**, stop deployment (Step 32.3) and record overrun — do not provision extra capacity.

**Not in MVP bill:** multi-region DR, second CDN, Kubernetes control plane, 100k CCU headroom.
