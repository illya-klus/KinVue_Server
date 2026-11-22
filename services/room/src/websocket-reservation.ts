import {
  Injectable,
  type OnApplicationBootstrap,
  type OnApplicationShutdown,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createServer, type Server } from "node:http";
import WebSocket, { WebSocketServer } from "ws";
import Redis from "ioredis";
import { roomsWebsocketConnections } from "./room-observability.metrics";
import { RoomsRedisReadiness } from "./health.controller";
import { RoomJwtService } from "./realtime/room-jwt.service";
import {
  RoomRealtimeStore,
  type RoomEvent,
  type Role,
} from "./realtime/room-store";
import {
  playbackCommandSchema,
  chatMessageSchema,
  chatReactionSchema,
} from "@kinvue/contracts";

type Session = {
  socket: WebSocket;
  roomId: string;
  userId: string;
  role?: Role;
  ready: boolean;
  buffer: RoomEvent[];
  queue: Promise<void>;
  queued: number;
};
type LocalRoom = {
  clients: Set<Session>;
  subscribed: boolean;
  pending: Promise<void>;
};
const uuid =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
@Injectable()
export class WebSocketReservation
  implements OnApplicationBootstrap, OnApplicationShutdown
{
  private server?: WebSocketServer;
  private http?: Server;
  private subscriber?: Redis;
  private timer?: ReturnType<typeof setInterval>;
  private readonly rooms = new Map<string, LocalRoom>();
  private stopping = false;
  constructor(
    private readonly config: ConfigService,
    private readonly jwt: RoomJwtService,
    private readonly store: RoomRealtimeStore,
    private readonly redis: RoomsRedisReadiness,
  ) {}
  address() {
    return this.http?.address();
  }
  get localSubscriptions() {
    return [...this.rooms]
      .filter(([, room]) => room.subscribed)
      .map(([id]) => id);
  }
  async onApplicationBootstrap() {
    await this.redis.ping();
    this.subscriber = this.redis.client.duplicate({
      lazyConnect: true,
      retryStrategy: () => null,
    });
    this.subscriber.on("message", (channel, data) =>
      this.broadcast(channel, data),
    );
    this.subscriber.on("error", () => {});
    this.subscriber.on("close", () => {
      if (!this.stopping)
        for (const room of this.rooms.values())
          for (const session of room.clients)
            session.socket.close(1012, "Reconnect to resync");
    });
    await this.subscriber.connect();
    const server = new WebSocketServer({
      noServer: true,
      maxPayload: 16 * 1024,
    });
    this.server = server;
    const http = createServer((_req, res) => {
      res.writeHead(404);
      res.end();
    });
    this.http = http;
    http.on("upgrade", (req, socket, head) => {
      void (async () => {
        const url = new URL(req.url ?? "/", "http://rooms.local");
        const roomId = url.searchParams.get("roomId"),
          token = url.searchParams.get("token");
        if (
          url.pathname !== "/rooms" ||
          !roomId ||
          !uuid.test(roomId) ||
          !token ||
          token.length > 8192
        )
          throw new Error("INVALID_HANDSHAKE");
        const identity = await this.jwt.verify(token);
        if (!uuid.test(identity.userId) || this.stopping || socket.destroyed)
          throw new Error("INVALID_HANDSHAKE");
        server.handleUpgrade(req, socket, head, (ws) =>
          this.connected(ws, roomId, identity.userId),
        );
      })().catch(() => {
        if (!socket.destroyed) {
          socket.write(
            "HTTP/1.1 401 Unauthorized\r\nConnection: close\r\n\r\n",
          );
          socket.destroy();
        }
      });
    });
    await new Promise<void>((resolve, reject) => {
      http.once("error", reject);
      http.listen(
        this.config.getOrThrow<number>("ROOMS_WS_PORT"),
        this.config.getOrThrow<string>("ROOMS_HTTP_HOST"),
        resolve,
      );
    });
    this.timer = setInterval(() => {
      void this.sweep().catch(() => {});
    }, 15000);
    this.timer.unref();
  }
  private connected(socket: WebSocket, roomId: string, userId: string) {
    const session: Session = {
      socket,
      roomId,
      userId,
      ready: false,
      buffer: [],
      queue: Promise.resolve(),
      queued: 0,
    };
    roomsWebsocketConnections.inc({ service: "rooms" });
    socket.on("error", () => {});
    socket.on("close", () => {
      roomsWebsocketConnections.dec({ service: "rooms" });
      void this.detach(session).catch(() => {});
    });
    socket.on("message", (data, binary) => {
      if (binary) {
        socket.close(1003, "JSON messages required");
        return;
      }
      if (!session.ready) {
        this.send(session, { type: "room.error", roomId, code: "NOT_SYNCED" });
        return;
      }
      if (++session.queued > 128) {
        socket.close(1013, "Reconnect to resync");
        return;
      }
      session.queue = session.queue
        .then(() => this.message(session, data.toString()))
        .catch(() => {
          this.send(session, {
            type: "room.error",
            roomId,
            code: "EVENT_REJECTED",
          });
        })
        .finally(() => {
          session.queued--;
        });
    });
    void this.initialize(session).catch(() => {
      socket.close(1008, "Room access denied");
    });
  }
  private async initialize(session: Session) {
    await this.attach(session);
    const state = await this.store.join(session.roomId, session.userId);
    if (session.socket.readyState !== WebSocket.OPEN) return;
    session.role = state.role;
    this.send(session, { ...state, userId: session.userId });
    session.ready = true;
    for (const event of session.buffer) {
      if (
        event.type === "room.playback_state_changed" &&
        Number(event.version) <= state.version
      )
        continue;
      this.deliver(session, event);
    }
    session.buffer = [];
  }
  private async message(session: Session, raw: string) {
    let msg: Record<string, unknown>;
    try {
      msg = JSON.parse(raw);
    } catch {
      throw new Error("INVALID_JSON");
    }
    if (!msg || typeof msg !== "object" || msg.roomId !== session.roomId)
      throw new Error("INVALID_ROOM");
    const type = msg.type;
    let payload: Record<string, unknown>;
    if (type === "room.play" || type === "room.pause" || type === "room.seek")
      payload = playbackCommandSchema.parse(msg);
    else if (type === "chat.message") {
      const { type: _, ...body } = msg;
      payload = chatMessageSchema.parse(body);
    } else if (type === "chat.reaction") {
      const { type: _, ...body } = msg;
      payload = chatReactionSchema.parse(body);
    } else if (type === "room.heartbeat" || type === "room.leave") payload = {};
    else throw new Error("INVALID_EVENT");
    await this.store.execute(session.roomId, session.userId, type, payload);
    if (type === "room.leave") session.socket.close(1000, "Left room");
  }
  private async attach(session: Session) {
    let room = this.rooms.get(session.roomId);
    if (!room) {
      room = {
        clients: new Set(),
        subscribed: false,
        pending: Promise.resolve(),
      };
      this.rooms.set(session.roomId, room);
    }
    room.clients.add(session);
    const local = room;
    local.pending = local.pending.then(async () => {
      if (local.clients.size && !local.subscribed) {
        await this.subscriber!.subscribe(`room:${session.roomId}:events`);
        local.subscribed = true;
      }
    });
    await local.pending;
  }
  private async detach(session: Session) {
    const room = this.rooms.get(session.roomId);
    if (!room) return;
    room.clients.delete(session);
    room.pending = room.pending
      .catch(() => {})
      .then(async () => {
        if (!room.clients.size) {
          if (room.subscribed) {
            await this.subscriber?.unsubscribe(`room:${session.roomId}:events`);
            room.subscribed = false;
          }
          if (!room.clients.size && this.rooms.get(session.roomId) === room)
            this.rooms.delete(session.roomId);
        }
      });
    await room.pending;
  }
  private broadcast(channel: string, raw: string) {
    const id = channel.slice(5, -7),
      room = this.rooms.get(id);
    if (!room) return;
    let event: RoomEvent;
    try {
      event = JSON.parse(raw);
    } catch {
      return;
    }
    if (event.roomId !== id) return;
    for (const session of room.clients) {
      if (!session.ready) {
        if (session.buffer.length >= 128)
          session.socket.close(1013, "Reconnect to resync");
        else session.buffer.push(event);
      } else {
        this.deliver(session, event);
      }
    }
  }
  private deliver(session: Session, event: RoomEvent) {
    this.send(session, event);
    if (event.type === "room.closed") session.socket.close(1008, "Room closed");
    if (event.type === "room.role_changed" && event.userId === session.userId)
      session.role = event.role as Role;
    if (
      event.type === "room.presence_changed" &&
      event.userId === session.userId &&
      event.presence === "LEFT"
    )
      session.socket.close(1000, "Left room");
  }
  private send(session: Session, event: RoomEvent) {
    if (session.socket.readyState === WebSocket.OPEN) {
      if (session.socket.bufferedAmount > 1024 * 1024) {
        session.socket.close(1013, "Reconnect to resync");
        return;
      }
      session.socket.send(JSON.stringify(event));
    }
  }
  async sweep(now = Date.now()) {
    for (const id of this.rooms.keys()) await this.store.sweep(id, now);
  }
  async onApplicationShutdown() {
    if (this.stopping) return;
    this.stopping = true;
    if (this.timer) clearInterval(this.timer);
    for (const room of this.rooms.values())
      for (const session of room.clients) session.socket.terminate();
    await Promise.all(
      [...this.rooms.values()].map((room) => room.pending.catch(() => {})),
    );
    this.subscriber?.disconnect();
    if (this.server)
      await new Promise<void>((resolve) => this.server!.close(() => resolve()));
    if (this.http)
      await new Promise<void>((resolve) => this.http!.close(() => resolve()));
    this.rooms.clear();
  }
}
