const assert = require("node:assert/strict");
const { spawn } = require("node:child_process");
const { once } = require("node:events");
const { join } = require("node:path");
const { setTimeout: delay } = require("node:timers/promises");

const service = process.argv[2];
const settings = {
  users: { directory: "user", port: 4002, prefix: "USERS" },
  movie: { directory: "movie", port: 4003, prefix: "MOVIE" },
}[service];
assert.ok(settings, "Pass users or movie");
const cwd = join(__dirname, "..", "services", settings.directory);
const sentinel = "smoke-credential-do-not-log";
const env = {
  ...process.env,
  NODE_ENV: "test",
  USERS_MONGO_URL: `mongodb://smoke:${sentinel}@127.0.0.1:1/kinvue_users`,
  MOVIE_DATABASE_URL: `postgresql://smoke:${sentinel}@127.0.0.1:1/kinvue_movies`,
  MEILISEARCH_HOST: "http://127.0.0.1:1",
  MEILISEARCH_MASTER_KEY: sentinel,
  [`${settings.prefix}_HTTP_HOST`]: "127.0.0.1",
};
delete env[`${settings.prefix}_HTTP_PORT`];

function start(overrides = {}) {
  const child = spawn(process.execPath, ["dist/main.js"], {
    cwd,
    env: { ...env, ...overrides },
    stdio: ["ignore", "pipe", "pipe"],
  });
  let output = "";
  child.stdout.on("data", (data) => {
    output += data;
  });
  child.stderr.on("data", (data) => {
    output += data;
  });
  const exited = once(child, "exit");
  return { child, exited, output: () => output };
}

async function main() {
  const origin = `http://127.0.0.1:${settings.port}`;
  // Refuse to mistake a pre-existing server for this process.
  try {
    await fetch(`${origin}/health/live`, { signal: AbortSignal.timeout(300) });
    assert.fail("Standard port is already occupied");
  } catch (error) {
    if (error.code === "ERR_ASSERTION") throw error;
  }
  const running = start();
  try {
    let live;
    for (let attempt = 0; attempt < 100; attempt++) {
      assert.equal(
        running.child.exitCode,
        null,
        "Service exited before listening",
      );
      try {
        live = await fetch(`${origin}/health/live`, {
          signal: AbortSignal.timeout(300),
        });
        break;
      } catch {
        await delay(50);
      }
    }
    assert.ok(live, "Service did not start on its standard port");
    assert.equal(live.status, 200);
    assert.deepEqual(await live.json(), { status: "ok", service });
    const ready = await fetch(`${origin}/health/ready`, {
      signal: AbortSignal.timeout(5000),
    });
    assert.equal(ready.status, 503);
    assert.deepEqual(await ready.json(), {
      code: "UPSTREAM_UNAVAILABLE",
      message: "Service dependency unavailable",
    });
    assert.equal((await fetch(`${origin}/health/live`)).status, 200);
    const metrics = await fetch(`${origin}/metrics`);
    assert.equal(metrics.status, 200);
    assert.match(await metrics.text(), /service_up 1/);
    assert.ok(running.output().includes(`"service":"${service}"`));
    assert.ok(
      !running.output().includes(sentinel),
      "Credential leaked to logs",
    );
  } finally {
    running.child.kill();
    await running.exited;
  }
  const invalid = start({ [`${settings.prefix}_HTTP_PORT`]: "0" });
  const result = await Promise.race([
    invalid.exited,
    delay(5000, null, { ref: false }),
  ]);
  if (!result) {
    invalid.child.kill();
    await invalid.exited;
  }
  assert.ok(result, "Invalid config did not stop the process");
  assert.notEqual(result[0], 0, "Invalid configuration must fail startup");
  assert.ok(
    !invalid.output().includes(sentinel),
    "Credential leaked on startup failure",
  );
  console.log(
    `${service}: default port, live, unavailable database, metrics, safe logs and invalid config passed`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
