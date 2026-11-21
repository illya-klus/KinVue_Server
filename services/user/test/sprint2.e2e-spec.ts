import { randomUUID } from "node:crypto";
import type { INestApplication } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Test } from "@nestjs/testing";
import { notificationEventSchema } from "@kinvue/contracts";
import amqp from "amqplib";
import type { Db } from "mongodb";
import request from "supertest";
import { SharedHttpErrorFilter } from "../src/errors.filters";
import { DOMAIN_EXCHANGE } from "../src/events/notification-publisher";
import { OutboxRepository } from "../src/events/outbox.repository";
import { OutboxWorker } from "../src/events/outbox.worker";
import { RabbitNotificationPublisher } from "../src/events/rabbit-notification.publisher";
import { MongoService } from "../src/mongo/mongo.service";
import { SharedLogger } from "../src/shared-logger";

const mongoUrl = process.env.TEST_USERS_MONGO_URL;
const rabbitUrl = process.env.TEST_USERS_RABBITMQ_URL;
const A = "550e8400-e29b-41d4-a716-446655440001";
const B = "550e8400-e29b-41d4-a716-446655440002";
const C = "550e8400-e29b-41d4-a716-446655440003";
const D = "550e8400-e29b-41d4-a716-446655440004";

(mongoUrl ? describe : describe.skip)(
  "Sprint 2 Users on a real MongoDB replica set",
  () => {
    let app: INestApplication;
    let db: Db;
    const profilePath = "/internal/users/profiles";

    function api() {
      return request(app.getHttpServer());
    }
    function send(from: string, to: string) {
      return api()
        .post("/friend-requests")
        .set("x-user-id", from)
        .send({ targetUserId: to });
    }

    beforeAll(async () => {
      const url = new URL(mongoUrl!);
      url.pathname = `/kinvue_s2_test_${randomUUID().replaceAll("-", "")}`;
      process.env.USERS_MONGO_URL = url.toString();
      process.env.NODE_ENV = "test";
      const { AppModule } = require("../src/app.module");
      const module = await Test.createTestingModule({ imports: [AppModule] })
        .overrideProvider(OutboxWorker)
        .useValue({})
        .compile();
      app = module.createNestApplication();
      app.useGlobalFilters(app.get(SharedHttpErrorFilter));
      await app.init();
      db = await app.get(MongoService).db();
    });

    afterAll(async () => {
      try {
        await db?.dropDatabase();
      } finally {
        await app?.close();
      }
    });

    beforeEach(async () => {
      await Promise.all(
        ["users", "friendships", "outbox_events"].map((name) =>
          db.collection(name).deleteMany({}),
        ),
      );
    });

    async function seedProfiles() {
      await Promise.all(
        [
          [A, "alice", "Alice"],
          [B, "bobby", "Bob [HR]"],
          [C, "carol", "Bob [HR] Two"],
          [D, "david", "David"],
        ].map(([userId, username, displayName]) =>
          api()
            .post(profilePath)
            .send({ userId, username, displayName })
            .expect(201),
        ),
      );
    }

    it("sets up unique indexes, creates each profile once and only updates the caller's permitted fields", async () => {
      const payload = { userId: A, username: "  ALICE ", displayName: "Alice" };
      await api().get("/health/ready").expect(200);
      await api().post(profilePath).send(payload).expect(201);
      await api()
        .post(profilePath)
        .send({ ...payload, displayName: "Other" })
        .expect(200)
        .expect(({ body }) => expect(body.displayName).toBe("Alice"));
      await api()
        .post(profilePath)
        .send({ ...payload, userId: B })
        .expect(409);
      expect(await db.collection("users").countDocuments()).toBe(1);
      expect(await db.collection("users").indexes()).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ key: { _id: 1 } }),
          expect.objectContaining({ key: { username: 1 }, unique: true }),
          expect.objectContaining({ key: { displayName: 1 } }),
          expect.objectContaining({ key: { createdAt: 1, _id: 1 } }),
        ]),
      );
      expect(await db.collection("friendships").indexes()).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            key: { user1Id: 1, user2Id: 1 },
            unique: true,
          }),
        ]),
      );
      await api().get("/users/me").expect(401);
      await api().get("/users/me").set("x-user-id", B).expect(404);
      const original = (
        await api().get(`/users/me?userId=${B}`).set("x-user-id", A).expect(200)
      ).body;
      expect(original).toMatchObject({
        userId: A,
        username: "alice",
        avatarUrl: null,
        preferences: { genres: [], languages: [], autoplay: true },
      });
      await api()
        .patch("/users/me")
        .set("x-user-id", A)
        .send({ userId: B, username: "hacker" })
        .expect(400);
      await api()
        .patch("/users/me")
        .set("x-user-id", A)
        .send({
          displayName: "Alice Two",
          avatarUrl: "https://example.test/avatar.png",
          preferences: {
            genres: ["Comedy"],
            languages: ["uk"],
            autoplay: false,
          },
        })
        .expect(200)
        .expect(({ body }) => {
          expect(body).toMatchObject({
            userId: A,
            username: "alice",
            displayName: "Alice Two",
            avatarUrl: "https://example.test/avatar.png",
            preferences: {
              genres: ["Comedy"],
              languages: ["uk"],
              autoplay: false,
            },
          });
          expect(body.updatedAt).not.toBe(original.updatedAt);
        });
    });

    it("searches literally and breaks pagination ties by id without returning private fields", async () => {
      await seedProfiles();
      await db
        .collection("users")
        .updateMany(
          {},
          { $set: { createdAt: new Date("2026-11-01T00:00:00Z") } },
        );
      await api().get("/users/search?query=b").set("x-user-id", A).expect(400);
      const search = (cursor?: string) =>
        api()
          .get("/users/search")
          .query({ query: " [hr] ", limit: 1, ...(cursor ? { cursor } : {}) })
          .set("x-user-id", A)
          .expect(200);
      const first = (await search()).body;
      expect(first.items).toEqual([
        { userId: B, username: "bobby", displayName: "Bob [HR]" },
      ]);
      expect(first.nextCursor).toEqual(expect.any(String));
      expect((await search(first.nextCursor)).body).toEqual({
        items: [{ userId: C, username: "carol", displayName: "Bob [HR] Two" }],
        nextCursor: null,
      });
    });

    it("enforces friendship transitions, paginates by direction, and writes exactly the creation and acceptance events", async () => {
      await seedProfiles();
      await send(A, A).expect(400);
      await send(A, randomUUID()).expect(404);
      const id = (await send(B, A).expect(201)).body.id;
      const other = (await send(C, A).expect(201)).body.id;
      await send(A, B).expect(409);
      const persisted = await db
        .collection("friendships")
        .findOne({ user1Id: A, user2Id: B });
      expect(persisted).toMatchObject({
        _id: id,
        requestedBy: B,
        status: "PENDING",
      });
      const first = (
        await api()
          .get("/friend-requests/incoming?limit=1")
          .set("x-user-id", A)
          .expect(200)
      ).body;
      const second = (
        await api()
          .get("/friend-requests/incoming")
          .query({ limit: 1, cursor: first.nextCursor })
          .set("x-user-id", A)
          .expect(200)
      ).body;
      expect(
        new Set([...first.items, ...second.items].map((row) => row.id)),
      ).toEqual(new Set([id, other]));
      await api()
        .get("/friend-requests/outgoing")
        .set("x-user-id", A)
        .expect(200, { items: [], nextCursor: null });
      await api()
        .get("/friend-requests/outgoing")
        .set("x-user-id", B)
        .expect(200)
        .expect(({ body }) =>
          expect(body.items.map((row: { id: string }) => row.id)).toEqual([id]),
        );
      for (const caller of [B, D]) {
        await api()
          .post(`/friend-requests/${id}/accept`)
          .set("x-user-id", caller)
          .expect(403);
        await api()
          .post(`/friend-requests/${id}/reject`)
          .set("x-user-id", caller)
          .expect(403);
      }
      await api()
        .post(`/friend-requests/${id}/accept`)
        .set("x-user-id", A)
        .expect(200);
      await api()
        .post(`/friend-requests/${id}/accept`)
        .set("x-user-id", A)
        .expect(409);
      await api()
        .post(`/friend-requests/${other}/reject`)
        .set("x-user-id", A)
        .expect(200);
      await send(A, C).expect(409);
      await api()
        .get("/friend-requests/incoming")
        .set("x-user-id", A)
        .expect(200, { items: [], nextCursor: null });
      await api()
        .get("/friends")
        .set("x-user-id", A)
        .expect(200, {
          items: [{ userId: B, username: "bobby", displayName: "Bob [HR]" }],
          nextCursor: null,
        });
      const events = await app.get(OutboxRepository).pending();
      expect(events).toHaveLength(3);
      expect(new Set(events.map((event) => event.eventId)).size).toBe(3);
      expect(
        events.map((event) => notificationEventSchema.parse(event)),
      ).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: "FRIEND_REQUEST_CREATED",
            recipientId: A,
            payload: { friendshipId: id, fromUserId: B },
          }),
          expect.objectContaining({
            type: "FRIEND_REQUEST_ACCEPTED",
            recipientId: B,
            payload: { friendshipId: id, fromUserId: A },
          }),
        ]),
      );
    });

    it("rolls back the friendship and outbox when the transaction fails", async () => {
      await seedProfiles();
      const outbox = app.get(OutboxRepository);
      const enqueue = outbox.enqueue.bind(outbox);
      const injectFailure = jest
        .spyOn(outbox, "enqueue")
        .mockImplementationOnce(async (event, session) => {
          await enqueue(event, session);
          throw new Error("injected transaction failure");
        });
      try {
        await send(A, B).expect(500);
        expect(await db.collection("friendships").countDocuments()).toBe(0);
        expect(await db.collection("outbox_events").countDocuments()).toBe(0);
      } finally {
        injectFailure.mockRestore();
      }
    });

    (rabbitUrl ? it : it.skip)(
      "retries a real RabbitMQ delivery and only marks a routed, confirmed event published",
      async () => {
        await seedProfiles();
        await send(A, B).expect(201);
        const repo = app.get(OutboxRepository);
        const [event] = await repo.pending();
        const down = new RabbitNotificationPublisher(
          new ConfigService({ RABBITMQ_URL: "amqp://127.0.0.1:1" }),
        );
        const logger = app.get(SharedLogger);
        const run = (publisher: RabbitNotificationPublisher) =>
          new OutboxWorker(
            new ConfigService(),
            repo,
            publisher,
            logger,
          ).publishPending();
        await run(down);
        expect(await repo.pending()).toEqual([event]);

        const connection = await amqp.connect(rabbitUrl!);
        const publisher = new RabbitNotificationPublisher(
          new ConfigService({ RABBITMQ_URL: rabbitUrl }),
        );
        try {
          const channel = await connection.createChannel();
          await channel.assertExchange(DOMAIN_EXCHANGE, "direct", {
            durable: true,
          });
          const { queue } = await channel.assertQueue("", { exclusive: true });
          await channel.bindQueue(
            queue,
            DOMAIN_EXCHANGE,
            "FRIEND_REQUEST_CREATED",
          );
          await run(publisher);
          expect(await repo.pending()).toEqual([]);
          const message = await channel.get(queue, { noAck: true });
          expect(message && JSON.parse(message.content.toString())).toEqual(
            event,
          );
          await run(publisher);
          expect(await channel.get(queue, { noAck: true })).toBe(false);
        } finally {
          await publisher.onApplicationShutdown();
          await connection.close();
        }
      },
    );
  },
);
