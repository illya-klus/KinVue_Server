# KinVue — Movie Search, Publishing, Indexing

## Data ownership

**PostgreSQL is the Movie source of truth.**

Meilisearch is:

- a search index;
- a derived projection;
- rebuildable/disposable.

If Meilisearch loses its data, the index can be rebuilt from PostgreSQL.

---

## Search workload

Capacity model:

- ~3.6k average QPS;
- ~7k–11k estimated peak QPS.

## Initial search optimizations

### Client-side debounce

Do not search on every keystroke.

Example:

```text
I
In
Int
Inte
Inter
(wait 300ms)
-> one search request
```

### Minimum query length

Optionally avoid very short low-value searches.

### No Redis result cache initially

Search-result caching is not automatically useful because typo-tolerant queries can be distinct:

```text
interstellar
interstelar
interst
...
```

A cache would create different keys while Meilisearch may return similar results.

Introduce a cache only if production metrics show useful hit rate for:

- trending;
- popular;
- genre pages;
- repeated common queries.

---

## Scaling strategy

Current decision:

1. Start simple.
2. Vertically scale Meilisearch if needed.
3. Benchmark/load test.
4. Observe p95/p99 latency, CPU, RAM, throughput.
5. Add horizontal/distributed search only if measurements justify it.

Do not add multiple search nodes purely because target QPS looks large on paper.

---

## Movie lifecycle

Possible movie statuses:

```text
DRAFT
SCHEDULED
PUBLISHED
```

Media pipeline adds operational states such as:

```text
UPLOADING
PROCESSING
READY
PUBLISHED
```

Exact final state machine can be refined in LLD.

---

## Publish now

Admin action:

1. update movie status in PostgreSQL;
2. attempt immediate upsert/index into Meilisearch;
3. if Meilisearch is temporarily unavailable, retry;
4. periodic reconciliation repairs missed/stale index state.

---

## Scheduled publish

Example:

```text
status = SCHEDULED
publishAt = 2026-09-15T18:00:00
```

Scheduler:

1. finds due releases;
2. changes source-of-truth status;
3. indexes/upserts immediately;
4. reconciliation job remains a safety net.

---

## Cron/reconciliation strategy

Because the catalog is relatively small and writes are rare, a periodic sync is valid.

Two approaches are acceptable.

### Full rebuild/reconciliation

For ~20k movies, a periodic full rebuild may be cheap enough.

Advantages:

- simple;
- self-healing;
- no incremental checkpoint bugs.

### Incremental sync

Use safe checkpoint boundaries.

Important rule:

**Do not move the checkpoint until Meilisearch confirms success.**

Also capture a stable upper bound:

```text
from = previousLastSuccessfulSync
to = jobStartedAt
```

Then query:

```text
updatedAt > from
updatedAt <= to
```

After successful indexing:

```text
lastSuccessfulSync = to
```

Do not set `lastSync = now()` after the work without a bounded window, because updates during the job can be skipped.

---

## Overlapping sync window

Because writes are rare and indexing is idempotent, deliberately reprocess a previous time window.

Example:

```text
sync from = lastSuccessfulSync - 24h
```

Benefits:

- protects against timestamp/checkpoint edge cases;
- protects against late updates;
- trades cheap repeated writes for simpler reliability.

Use idempotent upsert by stable `movieId`.

---

## Outbox vs cron

Transactional Outbox is stronger for event-driven consistency.

However, for Movie -> Meilisearch:

- catalog is small;
- writes are rare;
- eventual consistency is acceptable;
- index is rebuildable.

Therefore:

**cron/reconciliation + retry + idempotent upsert is acceptable and simpler for v1.**

Outbox can be added later if freshness/reliability requirements tighten.
