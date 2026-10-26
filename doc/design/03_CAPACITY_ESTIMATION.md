# KinVue — Capacity Estimation v1

## 1. Target scale

Assumptions:

- Concurrent users: **100,000**
- Users currently in rooms: **40% = 40,000**
- Users outside rooms: **60,000**
- Average users per room: **5**

Therefore:

- Concurrent rooms: `40,000 / 5 = 8,000`

---

## 2. Rooms and playback synchronization

### Assumptions

- Users in rooms: **40,000**
- Average users per room: **5**
- Concurrent rooms: **8,000**
- Playback commands per room: **50/min**
- Heartbeat assumption: **0.1/user/sec**

### WebSocket connections

Each room participant has a realtime connection.

- Concurrent WebSocket connections: **~40,000**

### Incoming playback commands

`8,000 rooms * 50 commands/min = 400,000 commands/min`

`400,000 / 60 ~= 6,667 commands/sec`

**Incoming playback events: ~6.7k/sec**

### Outgoing playback broadcasts

With 5 users/room, a command from one user is sent to ~4 other participants.

`6,667 * 4 ~= 26,667`

**Outgoing playback deliveries: ~26.7k/sec**

### Heartbeats

`40,000 * 0.1 = 4,000`

**Heartbeat events: ~4k/sec**

### Rooms summary

- Concurrent room users: **40k**
- Concurrent rooms: **8k**
- WebSocket connections: **40k**
- Incoming playback commands: **~6.7k/sec**
- Outgoing playback deliveries: **~26.7k/sec**
- Heartbeats: **~4k/sec**

---

## 3. Chat

### Assumptions

- Room users: **40,000**
- Active chatters: **50% = 20,000**
- Messages per active chatter: **2/min**
- Average stored message payload: **~500 B**
- Average room size: **5**

### Incoming messages

`20,000 * 2 = 40,000 messages/min`

`40,000 / 60 ~= 667 messages/sec`

**Incoming messages: ~667/sec**

### Outgoing deliveries

`667 * 4 ~= 2,668`

**Outgoing message deliveries: ~2.7k/sec**

### Reactions

Baseline assumption:

- Incoming reactions: **~333/sec**
- Outgoing reaction deliveries: **~1,332/sec**

### Chat network payload

At ~500 B/message:

- Incoming: **~0.33 MB/sec**
- Outgoing: **~1.33 MB/sec**

This excludes protocol/network overhead.

### Raw storage upper bound

If peak chat traffic were sustained 24 hours:

`667 msg/sec * 86,400 sec * 500 B ~= 29 GB/day`

**Raw message data: ~29 GB/day at sustained peak**

This is an upper-bound capacity model, not expected average daily usage.

---

## 4. Movie search

### Assumptions

- Users outside rooms: **60,000**
- Active movie browsers: **60% = 36,000**
- Search frequency: **1 request / 10 sec / active browser**
- Results per query: **~20**
- Estimated response size: **~10 KB**

### Search QPS

`36,000 / 10 = 3,600`

**Average search QPS: ~3.6k**

Estimated peak:

**~7k–11k QPS**

### Search response throughput

`3,600 * 10 KB ~= 36 MB/sec`

**Search response traffic: ~36 MB/sec**

---

## 5. Media streaming

### Concurrent viewers

Room viewers:

- **40,000**

Solo viewers:

- Users outside rooms: **60,000**
- Solo watch assumption: **10%**
- `60,000 * 0.10 = 6,000`

Total:

- **46,000 concurrent video streams**

### Bandwidth baseline

Assumed average stream bitrate:

- **5 Mbps**

`46,000 * 5 Mbps = 230,000 Mbps = 230 Gbps`

Equivalent:

- **~28.75 GB/sec**

If sustained:

- **~103.5 TB/hour**
- **~207 TB / 2 hours**

### Quality scenarios

- 3 Mbps -> **~138 Gbps** -> ~62 TB/hour
- 5 Mbps -> **~230 Gbps** -> ~104 TB/hour
- 8 Mbps -> **~368 Gbps** -> ~166 TB/hour
- 15 Mbps -> **~690 Gbps** -> ~311 TB/hour

---

## 6. Load significance

The numbers show three different load classes:

### Media

By far the dominant bandwidth consumer.

- ~46k streams
- ~230 Gbps at 5 Mbps average

This traffic must bypass application servers.

### Realtime Rooms

Architecturally difficult because of:

- 40k persistent WebSockets
- ~6.7k incoming commands/sec
- ~26.7k outgoing sync events/sec
- cross-instance fan-out
- reconnect/resync requirements

### Search

Potentially heavy read workload:

- ~3.6k average QPS
- ~7–11k peak QPS

Needs load testing before horizontal scaling is added.

### Chat

Moderate compared to media/realtime:

- ~667 writes/sec
- ~2.7k deliveries/sec

Main concern is semantics/retention, not raw throughput.

---

## 7. Key conclusion

There is no universal number where "RPS becomes high".

A workload is too high when the actual deployed system can no longer satisfy the NFRs.

The real process is:

1. Estimate expected load.
2. Implement.
3. Load test.
4. Observe:
   - CPU
   - memory
   - network
   - DB connections
   - DB CPU/IOPS
   - event loop lag
   - p95/p99 latency
   - error rate
   - queue depth
5. Find saturation.
6. Optimize or scale.

Rough mental scale only:

- <100 RPS: usually small
- 100–1k RPS: normal production workload
- 1k–10k RPS: serious capacity planning
- 10k+ RPS: high-load territory
- 100k+ RPS: very large scale

These are not server-capacity guarantees.
