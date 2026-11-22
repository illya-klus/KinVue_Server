const { test } = require("node:test");
const assert = require("node:assert/strict");
const { spawnSync } = require("node:child_process");
const { randomUUID } = require("node:crypto");
const { createServer } = require("node:http");
const { createRequire } = require("node:module");
const { resolve } = require("node:path");
const { setTimeout: delay } = require("node:timers/promises");
const Redis = require("ioredis").default;
const WebSocket = require("ws");
const { ConfigService } = require("@nestjs/config");
const { WebSocketReservation } = require("../dist/websocket-reservation");
const { RoomJwtService } = require("../dist/realtime/room-jwt.service");
const { RoomRealtimeStore } = require("../dist/realtime/room-store");
const { RoomsService } = require("../dist/rooms.service");
const jwtRequire = createRequire(
  resolve(__dirname, "../../../packages/jwt/package.json"),
);
const { generateKeyPair, exportJWK, SignJWT } = jwtRequire("jose");
const docker = (args) =>
  spawnSync("docker", args, { encoding: "utf8", windowsHide: true });
async function until(fn) {
  for (let i = 0; i < 100; i++) {
    if (await fn()) return;
    await delay(25);
  }
  assert.fail("Timed out waiting for expected state");
}
function client(url) {
  const ws = new WebSocket(url),
    messages = [];
  let closed;
  ws.on("message", (data) => messages.push(JSON.parse(data.toString())));
  ws.on("close", (code, reason) => {
    closed = { code, reason: String(reason) };
  });
  ws.on("error", () => {});
  return {
    ws,
    messages,
    get closed() {
      return closed;
    },
    async next(type, predicate = () => true) {
      let index = -1;
      await until(() => {
        index = messages.findIndex(
          (msg) => msg.type === type && predicate(msg),
        );
        return index >= 0;
      });
      return messages[index];
    },
  };
}
test(
  "two Rooms instances authenticate, authorize and synchronize through real Redis 7",
  { timeout: 120000 },
  async () => {
    const name = "kinvue-realtime-test-" + randomUUID().slice(0, 8),
      port = Number(process.env.ROOMS_TEST_REDIS_PORT || 56379);
    assert.equal(
      docker([
        "run",
        "-d",
        "--rm",
        "--name",
        name,
        "-p",
        `127.0.0.1:${port}:6379`,
        "redis:7-alpine",
      ]).status,
      0,
    );
    const redis = new Redis(`redis://127.0.0.1:${port}`, {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
    });
    redis.on("error", () => {});
    let jwksServer;
    const instances = [],
      connections = [];
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
      assert.equal(await redis.ping(), "PONG");
      const { privateKey, publicKey } = await generateKeyPair("RS256");
      const jwk = {
        ...(await exportJWK(publicKey)),
        alg: "RS256",
        use: "sig",
        kid: "rooms-test-key",
      };
      let jwksRequests = 0;
      jwksServer = createServer((_req, res) => {
        jwksRequests++;
        res.setHeader("content-type", "application/json");
        res.end(JSON.stringify({ keys: [jwk] }));
      });
      await new Promise((resolve) =>
        jwksServer.listen(0, "127.0.0.1", resolve),
      );
      const authUrl = "http://127.0.0.1:" + jwksServer.address().port;
      const owner = randomUUID(),
        viewer = randomUUID();
      const tokens = async (userId, options = {}) =>
        new SignJWT({ scopes: [] })
          .setProtectedHeader({ alg: "RS256", kid: "rooms-test-key" })
          .setSubject(userId)
          .setIssuedAt()
          .setIssuer(options.issuer || "rooms-test")
          .setAudience("kinvue")
          .setExpirationTime(options.expired ? "0s" : "15m")
          .sign(privateKey);
      const ownerToken = await tokens(owner),
        viewerToken = await tokens(viewer);
      const invitations = new Map();
      const invites = {
        findDirectInvite: async (room, user) =>
          invitations.get(room + ":" + user) ?? null,
        markAccepted: async (id) => {
          for (const [key, value] of invitations)
            if (value.id === id) invitations.delete(key);
        },
        revokeForRoom: async () => {},
      };
      const rooms = new RoomsService(redis, invites);
      const store = new RoomRealtimeStore(redis, invites);
      for (let i = 0; i < 2; i++) {
        const config = new ConfigService({
          ROOMS_WS_PORT: 0,
          ROOMS_HTTP_HOST: "127.0.0.1",
          AUTH_SERVICE_URL: authUrl,
          JWT_ISSUER: "rooms-test",
          JWT_AUDIENCE: "kinvue",
        });
        const instance = new WebSocketReservation(
          config,
          new RoomJwtService(config),
          store,
          { client: redis, ping: () => redis.ping() },
        );
        await instance.onApplicationBootstrap();
        instances.push(instance);
      }
      const url = (instance, room, token) =>
        `ws://127.0.0.1:${instance.address().port}/rooms?roomId=${room}&token=${token}`;
      const connect = (instance, room, token) => {
        const result = client(url(instance, room, token));
        connections.push(result);
        return result;
      };
      const publicRoom = (await rooms.createRoom("movie-1", "PUBLIC", owner))
        .id;
      const privateRoom = (await rooms.createRoom("movie-1", "PRIVATE", owner))
        .id;
      const closedRoom = (await rooms.createRoom("movie-1", "PUBLIC", owner))
        .id;
      await rooms.closeRoom(closedRoom, owner);
      for (const token of [
        "",
        "broken",
        ownerToken.slice(0, -8) + "tampered",
        await tokens(owner, { expired: true }),
        await tokens(owner, { issuer: "wrong" }),
      ]) {
        await new Promise((resolve, reject) => {
          const ws = new WebSocket(url(instances[0], publicRoom, token));
          ws.on("error", () => {});
          ws.once("unexpected-response", (_req, res) => {
            assert.equal(res.statusCode, 401);
            res.resume();
            ws.terminate();
            resolve();
          });
          ws.once("open", () => {
            ws.terminate();
            reject(new Error("Invalid token opened a socket"));
          });
        });
      }
      for (const room of [randomUUID(), closedRoom, privateRoom]) {
        const denied = connect(instances[0], room, viewerToken);
        await until(() => denied.closed);
        assert.equal(denied.closed.code, 1008);
        assert.equal(denied.messages.length, 0);
      }
      invitations.set(privateRoom + ":" + viewer, {
        id: randomUUID(),
        role: "VIEWER",
      });
      const invited = connect(instances[0], privateRoom, viewerToken);
      assert.equal((await invited.next("room.state_sync")).role, "VIEWER");
      invited.ws.close();
      const full = (await rooms.createRoom("movie-1", "PUBLIC", owner)).id;
      for (let i = 0; i < 19; i++) {
        const id = randomUUID();
        await redis.hset(
          `room:${full}:members`,
          id,
          JSON.stringify({
            userId: id,
            role: "VIEWER",
            presence: "ONLINE",
            lastHeartbeatAt: Date.now(),
          }),
        );
      }
      const denied = connect(instances[0], full, viewerToken);
      await until(() => denied.closed);
      assert.equal(denied.closed.code, 1008);
      const a = connect(instances[0], publicRoom, ownerToken),
        b = connect(instances[1], publicRoom, viewerToken);
      assert.equal((await a.next("room.state_sync")).role, "OWNER");
      assert.equal((await b.next("room.state_sync")).role, "VIEWER");
      assert.equal(a.messages[0].type, "room.state_sync");
      assert.equal(b.messages[0].type, "room.state_sync");
      assert.ok(instances[0].localSubscriptions.includes(publicRoom));
      assert.deepEqual(instances[1].localSubscriptions, [publicRoom]);
      const authCalls = jwksRequests;
      a.ws.send(
        JSON.stringify({
          type: "chat.message",
          roomId: privateRoom,
          messageId: randomUUID(),
          text: "Cross-room attempt",
        }),
      );
      await a.next("room.error");
      assert.equal(await redis.llen(`room:${privateRoom}:messages`), 0);
      const command = (peer, type, positionSeconds = 0, roomId = publicRoom) =>
        peer.ws.send(
          JSON.stringify({
            type,
            roomId,
            eventId: randomUUID(),
            positionSeconds,
            clientSentAt: new Date().toISOString(),
          }),
        );
      command(b, "room.play");
      await b.next("room.error");
      assert.equal(await redis.hget(`room:${publicRoom}`, "version"), "0");
      command(a, "room.seek", 10);
      await b.next(
        "room.playback_state_changed",
        (event) => event.version === 1,
      );
      command(a, "room.play", 0);
      const playing = await b.next(
        "room.playback_state_changed",
        (event) => event.version === 2,
      );
      assert.equal(playing.positionSeconds, 10);
      await delay(60);
      command(a, "room.pause", 0);
      const paused = await b.next(
        "room.playback_state_changed",
        (event) => event.version === 3,
      );
      assert.equal(paused.playbackStatus, "PAUSED");
      assert.ok(paused.positionSeconds >= 10.04);
      command(a, "room.seek", 3);
      await b.next(
        "room.playback_state_changed",
        (event) => event.version === 4 && event.positionSeconds === 3,
      );
      command(a, "room.seek", 50);
      await b.next(
        "room.playback_state_changed",
        (event) => event.version === 5 && event.positionSeconds === 50,
      );
      await rooms.changeMemberRole(publicRoom, viewer, "CONTROLLER", owner);
      await b.next("room.role_changed", (event) => event.role === "CONTROLLER");
      command(a, "room.play");
      command(b, "room.seek", 60);
      await b.next(
        "room.playback_state_changed",
        (event) => event.version === 7,
      );
      assert.equal(await redis.hget(`room:${publicRoom}`, "version"), "7");
      b.ws.terminate();
      await until(() => instances[1].localSubscriptions.length === 0);
      command(a, "room.seek", 70);
      await a.next(
        "room.playback_state_changed",
        (event) => event.version === 8,
      );
      const reconnect = connect(instances[1], publicRoom, viewerToken);
      const sync = await reconnect.next("room.state_sync");
      assert.equal(sync.version, 8);
      assert.equal(sync.positionSeconds, 70);
      assert.equal(sync.role, "CONTROLLER");
      await delay(50);
      assert.equal(
        reconnect.messages.filter(
          (event) => event.type === "room.playback_state_changed",
        ).length,
        0,
      );
      await instances[0].sweep(Date.now() + 76000);
      await reconnect.next(
        "room.presence_changed",
        (event) => event.userId === viewer && event.presence === "DISCONNECTED",
      );
      reconnect.ws.send(
        JSON.stringify({ type: "room.heartbeat", roomId: publicRoom }),
      );
      await a.next(
        "room.presence_changed",
        (event) => event.userId === viewer && event.presence === "ONLINE",
      );
      const message = {
        type: "chat.message",
        roomId: publicRoom,
        messageId: randomUUID(),
        text: "Hello from instance one",
      };
      a.ws.send(JSON.stringify(message));
      a.ws.send(JSON.stringify(message));
      await reconnect.next(
        "chat.message_created",
        (event) => event.messageId === message.messageId,
      );
      await delay(50);
      assert.equal(
        reconnect.messages.filter(
          (event) =>
            event.type === "chat.message_created" &&
            event.messageId === message.messageId,
        ).length,
        1,
      );
      reconnect.ws.send(JSON.stringify(message));
      await a.next("chat.message_created", (event) => event.userId === viewer);
      assert.equal(await redis.llen(`room:${publicRoom}:messages`), 2);
      const errors = reconnect.messages.filter(
        (event) => event.type === "room.error",
      ).length;
      for (const text of [" ", "x".repeat(1001)])
        reconnect.ws.send(
          JSON.stringify({ ...message, text, messageId: randomUUID() }),
        );
      reconnect.ws.send(
        JSON.stringify({
          type: "chat.reaction",
          roomId: publicRoom,
          reactionId: randomUUID(),
          emoji: "banana",
        }),
      );
      await until(
        () =>
          reconnect.messages.filter((event) => event.type === "room.error")
            .length ===
          errors + 3,
      );
      for (const emoji of ["like", "laugh", "wow", "sad", "fire"]) {
        a.ws.send(
          JSON.stringify({
            type: "chat.reaction",
            roomId: publicRoom,
            reactionId: randomUUID(),
            emoji,
          }),
        );
        await reconnect.next(
          "chat.reaction_created",
          (event) => event.emoji === emoji,
        );
      }
      assert.equal(
        await redis.llen(`room:${publicRoom}:messages`),
        2,
        "Reactions must not create stored chat rows",
      );
      const old = {
        messageId: randomUUID(),
        text: "expired",
        userId: owner,
        createdAtMs: Date.now() - 25 * 3600000,
      };
      await redis.lpush(`room:${publicRoom}:messages`, JSON.stringify(old));
      a.ws.send(
        JSON.stringify({ ...message, messageId: randomUUID(), text: "Fresh" }),
      );
      await reconnect.next(
        "chat.message_created",
        (event) => event.text === "Fresh",
      );
      assert.ok(
        (await redis.lrange(`room:${publicRoom}:messages`, 0, -1)).every(
          (raw) => JSON.parse(raw).text !== "expired",
        ),
      );
      assert.ok((await redis.ttl(`room:${publicRoom}:messages`)) > 0);
      assert.ok(
        (await redis.ttl(`room:${publicRoom}:messages`)) <=
          (await redis.ttl(`room:${publicRoom}`)),
      );
      const beforeLeave = await redis.hget(`room:${publicRoom}`, "version");
      reconnect.ws.send(
        JSON.stringify({ type: "room.leave", roomId: publicRoom }),
      );
      await until(() => reconnect.closed);
      assert.equal(
        JSON.parse(await redis.hget(`room:${publicRoom}:members`, viewer))
          .presence,
        "LEFT",
      );
      await assert.rejects(
        store.execute(publicRoom, viewer, "room.play"),
        /MEMBERSHIP_REQUIRED/,
      );
      assert.equal(
        await redis.hget(`room:${publicRoom}`, "version"),
        beforeLeave,
      );
      assert.equal(
        jwksRequests,
        authCalls,
        "Playback, presence and chat must not call Auth",
      );
      await rooms.closeRoom(publicRoom, owner);
      await until(() => a.closed);
      assert.ok((await redis.ttl(`room:${publicRoom}:messages`)) <= 900);
      assert.ok((await redis.ttl(`room:${publicRoom}:message-ids`)) <= 900);
    } finally {
      for (const peer of connections) peer.ws.terminate();
      for (const instance of instances) await instance.onApplicationShutdown();
      redis.disconnect();
      if (jwksServer) await new Promise((resolve) => jwksServer.close(resolve));
      docker(["stop", name]);
    }
  },
);
