/* Opt-in local Rooms smoke: real WS/JWT/Redis, fixture HTTP Auth and metadata. */
const assert = require("node:assert/strict");
const { spawnSync } = require("node:child_process");
const { createServer } = require("node:http");
const { createRequire } = require("node:module");
const { resolve } = require("node:path");
const { randomUUID } = require("node:crypto");
const { setTimeout: delay } = require("node:timers/promises");
const Redis = require("ioredis").default;
const WebSocket = require("ws");
const { ConfigService } = require("@nestjs/config");
const { WebSocketReservation } = require("../dist/websocket-reservation");
const { RoomJwtService } = require("../dist/realtime/room-jwt.service");
const { RoomRealtimeStore } = require("../dist/realtime/room-store");
const { RoomsService } = require("../dist/rooms.service");
const { chromium, expect } = createRequire(
  resolve(__dirname, "../../../../KinVue_Client/package.json"),
)("@playwright/test");
const { generateKeyPair, exportJWK, SignJWT } = createRequire(
  resolve(__dirname, "../../../packages/jwt/package.json"),
)("jose");
const base = process.env.ROOMS_BROWSER_BASE_URL || "http://localhost:3000";
const docker = (args) =>
  spawnSync("docker", args, { encoding: "utf8", windowsHide: true });
async function until(fn) {
  for (let i = 0; i < 200; i++) {
    if (await fn()) return;
    await delay(25);
  }
  throw new Error("Expected room state did not arrive");
}
async function main() {
  const name = "kinvue-room-browser-" + randomUUID().slice(0, 8);
  assert.equal(
    docker([
      "run",
      "-d",
      "--rm",
      "--name",
      name,
      "-p",
      "127.0.0.1:56380:6379",
      "redis:7-alpine",
    ]).status,
    0,
  );
  const redis = new Redis("redis://127.0.0.1:56380", {
    lazyConnect: true,
    maxRetriesPerRequest: 1,
  });
  redis.on("error", () => {});
  const instances = [];
  let http, browser, peer;
  try {
    for (let i = 0; i < 60; i++) {
      try {
        await redis.connect();
        await redis.ping();
        break;
      } catch {
        redis.disconnect();
        await delay(250);
      }
    }
    const { privateKey, publicKey } = await generateKeyPair("RS256");
    const jwk = {
      ...(await exportJWK(publicKey)),
      kid: "browser-room-key",
      alg: "RS256",
      use: "sig",
    };
    const owner = randomUUID(),
      viewer = randomUUID();
    const issue = (user) =>
      new SignJWT({ scopes: [] })
        .setProtectedHeader({ kid: jwk.kid, alg: "RS256" })
        .setSubject(user)
        .setIssuedAt()
        .setIssuer("kinvue-auth")
        .setAudience("kinvue")
        .setExpirationTime("15m")
        .sign(privateKey);
    const ownerToken = await issue(owner),
      viewerToken = await issue(viewer);
    const config = (port) =>
      new ConfigService({
        ROOMS_HTTP_HOST: "127.0.0.1",
        ROOMS_WS_PORT: port,
        AUTH_SERVICE_URL: "http://127.0.0.1:4000",
        JWT_ISSUER: "kinvue-auth",
        JWT_AUDIENCE: "kinvue",
      });
    const jwt = new RoomJwtService(config(4014));
    const invites = {
      findDirectInvite: async () => null,
      markAccepted: async () => {},
      revokeForRoom: async () => {},
    };
    const store = new RoomRealtimeStore(redis, invites),
      rooms = new RoomsService(redis, invites);
    const roomId = (await rooms.createRoom("fixture", "PUBLIC", owner)).id;
    http = createServer((req, res) => {
      void (async () => {
        res.setHeader("access-control-allow-origin", base);
        res.setHeader("access-control-allow-credentials", "true");
        res.setHeader(
          "access-control-allow-headers",
          "authorization,content-type",
        );
        res.setHeader("access-control-allow-methods", "GET,POST,OPTIONS");
        res.setHeader("content-type", "application/json");
        if (req.method === "OPTIONS") {
          res.statusCode = 204;
          return res.end();
        }
        if (req.url === "/.well-known/jwks.json")
          return res.end(JSON.stringify({ keys: [jwk] }));
        if (req.url === "/api/auth/login") {
          res.setHeader(
            "set-cookie",
            "kinvue_refresh=fixture; Path=/api/auth; HttpOnly; SameSite=Strict",
          );
          return res.end(JSON.stringify({ accessToken: ownerToken }));
        }
        if (req.url === "/api/auth/refresh") {
          if (req.headers.cookie?.includes("kinvue_refresh=fixture"))
            return res.end(JSON.stringify({ accessToken: ownerToken }));
          res.statusCode = 401;
          return res.end("{}");
        }
        if (req.url?.startsWith("/api/notifications"))
          return res.end(JSON.stringify({ items: [] }));
        if (req.url === `/api/rooms/${roomId}/members`) {
          const identity = await jwt.verify(
            String(req.headers.authorization).replace(/^Bearer /, ""),
          );
          return res.end(
            JSON.stringify(await rooms.getRoomMembers(roomId, identity.userId)),
          );
        }
        res.statusCode = 503;
        res.end(
          JSON.stringify({ message: "Media is outside this Rooms test" }),
        );
      })().catch(() => {
        res.statusCode = 403;
        res.end("{}");
      });
    });
    await new Promise((resolve) => http.listen(4000, "127.0.0.1", resolve));
    for (const port of [4014, 4015]) {
      const service = new WebSocketReservation(
        config(port),
        new RoomJwtService(config(port)),
        store,
        { client: redis, ping: () => redis.ping() },
      );
      await service.onApplicationBootstrap();
      instances.push(service);
    }
    const events = [];
    peer = new WebSocket(
      `ws://127.0.0.1:4015/rooms?roomId=${roomId}&token=${viewerToken}`,
    );
    peer.on("error", () => {});
    peer.on("message", (raw) => events.push(JSON.parse(String(raw))));
    await until(() => events.some((e) => e.type === "room.state_sync"));
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    page.setDefaultTimeout(15000);
    page.setDefaultNavigationTimeout(60000);
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(base + "/login");
    await page.getByLabel("Email").fill("owner@example.test");
    await page.getByLabel("Password").fill("fixture-password");
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await expect(page).toHaveURL(/movies\/search/);
    await page.goto(base + "/rooms/" + roomId);
    await expect(
      page.getByRole("button", { name: "Play", exact: true }),
    ).toBeEnabled();
    await page.getByLabel("Seek position (seconds)").fill("5");
    await page.getByRole("button", { name: "Seek", exact: true }).click();
    await until(() =>
      events.some(
        (e) =>
          e.type === "room.playback_state_changed" &&
          e.version === 1 &&
          e.positionSeconds === 5,
      ),
    );
    await page.getByRole("button", { name: "Play", exact: true }).click();
    await until(() =>
      events.some((e) => e.playbackStatus === "PLAYING" && e.version === 2),
    );
    await page.getByRole("button", { name: "Pause", exact: true }).click();
    await until(() =>
      events.some((e) => e.playbackStatus === "PAUSED" && e.version === 3),
    );
    await page.getByLabel("Chat message").fill("Browser to instance two");
    await page.getByRole("button", { name: "Send", exact: true }).click();
    await until(() =>
      events.some(
        (e) =>
          e.type === "chat.message_created" &&
          e.text === "Browser to instance two",
      ),
    );
    peer.send(
      JSON.stringify({
        type: "chat.message",
        roomId,
        messageId: randomUUID(),
        text: "Instance two to browser",
      }),
    );
    await expect(
      page.getByText("Instance two to browser", { exact: true }),
    ).toBeVisible();
    await page.getByRole("button", { name: "React fire", exact: true }).click();
    await until(() =>
      events.some(
        (e) => e.type === "chat.reaction_created" && e.emoji === "fire",
      ),
    );
    peer.send(
      JSON.stringify({
        type: "chat.reaction",
        roomId,
        reactionId: randomUUID(),
        emoji: "like",
      }),
    );
    await expect(page.getByLabel("Recent reactions")).toContainText("👍");
    await instances[0].onApplicationShutdown();
    await expect(
      page.getByRole("button", { name: "Pause", exact: true }),
    ).toBeDisabled();
    instances[0] = new WebSocketReservation(
      config(4014),
      new RoomJwtService(config(4014)),
      store,
      { client: redis, ping: () => redis.ping() },
    );
    await instances[0].onApplicationBootstrap();
    await expect(
      page.getByRole("button", { name: "Pause", exact: true }),
    ).toBeEnabled();
    await expect(
      page.getByRole("status").filter({ hasText: "Your role" }),
    ).toContainText("version 3");
    await page.screenshot({
      path: resolve(__dirname, "../../../../.jira-review/sprint4-room.png"),
      fullPage: true,
    });
    await page.getByRole("button", { name: "Leave room" }).click();
    await until(
      async () =>
        JSON.parse(await redis.hget(`room:${roomId}:members`, owner))
          .presence === "LEFT",
    );
    assert.deepEqual(errors, []);
    console.log(
      "PASS browser -> authenticated Rooms WS -> Redis 7 -> second Rooms instance -> browser; restart/resync and leave",
    );
  } finally {
    peer?.terminate();
    await browser?.close();
    for (const service of instances) await service.onApplicationShutdown();
    redis.disconnect();
    if (http) await new Promise((resolve) => http.close(resolve));
    docker(["stop", name]);
  }
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
