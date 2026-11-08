/**
 * KIN-241 — movie search load sketch (Phase 31.3).
 * BASE_URL=http://localhost:4000 node tests/load/movie-search.mjs
 */
const base = process.env.BASE_URL ?? "http://localhost:4000";
const queries = Number(process.env.LOAD_REQUESTS ?? 100);
const q = process.env.SEARCH_Q ?? "star";

const latencies = [];
const started = performance.now();

for (let i = 0; i < queries; i++) {
  const t0 = performance.now();
  const response = await fetch(
    `${base}/api/movies/search?q=${encodeURIComponent(q)}&limit=20`,
  );
  latencies.push(performance.now() - t0);
  if (!response.ok) {
    console.error("search failed", response.status);
    process.exit(1);
  }
}

latencies.sort((a, b) => a - b);
const elapsed = (performance.now() - started) / 1000;
const pct = (p) => latencies[Math.floor((latencies.length * p) / 100)] ?? 0;

console.log(
  JSON.stringify(
    {
      queries,
      qps: queries / elapsed,
      p50Ms: pct(50),
      p95Ms: pct(95),
      p99Ms: pct(99),
      paperModelNote: "3.6k avg / 7–11k peak is architecture capacity model, not this run.",
    },
    null,
    2,
  ),
);
