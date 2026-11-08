/**
 * KIN-234 — local Gateway load sketch (Phase 31.1).
 * Usage: LOAD_JWT=<access> BASE_URL=http://localhost:4000 node tests/load/gateway-authenticated-api.mjs
 */
const base = process.env.BASE_URL ?? "http://localhost:4000";
const token = process.env.LOAD_JWT;
const requests = Number(process.env.LOAD_REQUESTS ?? 200);
const concurrency = Number(process.env.LOAD_CONCURRENCY ?? 10);

if (!token) {
  console.error("Set LOAD_JWT to a valid access token.");
  process.exit(1);
}

const latencies = [];

async function one() {
  const start = performance.now();
  const response = await fetch(`${base}/api/users/me`, {
    headers: { authorization: `Bearer ${token}` },
  });
  latencies.push(performance.now() - start);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
}

let next = 0;
async function worker() {
  while (next < requests) {
    const i = next++;
    if (i >= requests) break;
    await one();
  }
}

const started = performance.now();
await Promise.all(Array.from({ length: concurrency }, () => worker()));
const elapsed = (performance.now() - started) / 1000;
latencies.sort((a, b) => a - b);
const pct = (p) => latencies[Math.floor((latencies.length * p) / 100)] ?? 0;

console.log(
  JSON.stringify(
    {
      requests,
      concurrency,
      durationSeconds: elapsed,
      rps: requests / elapsed,
      p50Ms: pct(50),
      p95Ms: pct(95),
      p99Ms: pct(99),
      note: "Local sample — not 100k CCU proof.",
    },
    null,
    2,
  ),
);
