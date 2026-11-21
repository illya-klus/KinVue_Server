/**
 * CI helper: wait for compose health endpoints (KIN-240).
 */
import { setTimeout as sleep } from "node:timers/promises";

const checks = [
  { name: "auth-postgres", tcpPort: 5432 },
  { name: "movie-postgres", tcpPort: 5434 },
  { name: "notifications-postgres", tcpPort: 5435 },
  { name: "rooms-postgres", tcpPort: 5436 },
  { name: "rooms-redis", tcpPort: 6379 },
  { name: "rooms-http", url: "http://127.0.0.1:4004/health/ready" },
  { name: "meilisearch", url: "http://127.0.0.1:7700/health" },
  { name: "rabbitmq", tcpPort: 5672 },
];

async function tcpOpen(host, port) {
  const net = await import("node:net");
  return new Promise((resolve) => {
    const socket = net.connect(port, host, () => {
      socket.end();
      resolve(true);
    });
    socket.on("error", () => resolve(false));
    socket.setTimeout(2000, () => {
      socket.destroy();
      resolve(false);
    });
  });
}

async function httpOk(url) {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(3000) });
    return response.ok;
  } catch {
    return false;
  }
}

const deadline = Date.now() + 120_000;
let ok = false;
while (Date.now() < deadline) {
  let all = true;
  for (const check of checks) {
    if (check.tcp) {
      if (!(await tcpOpen("127.0.0.1", 5432))) all = false;
    } else if (check.tcpPort) {
      if (!(await tcpOpen("127.0.0.1", check.tcpPort))) all = false;
    } else if (!(await httpOk(check.url))) {
      all = false;
    }
  }
  if (all) {
    ok = true;
    break;
  }
  await sleep(3000);
}

if (!ok) {
  console.error("Infra health wait timed out");
  process.exit(1);
}
console.log("infra ready");
