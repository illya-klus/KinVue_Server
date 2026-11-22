import {
  Controller,
  Get,
  Inject,
  Injectable,
  ServiceUnavailableException,
  type OnApplicationShutdown,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Redis from "ioredis";
import { roomsRedisReachable } from "./room-observability.metrics";
import type { RoomsDatabaseService } from "./database/rooms-database.service";

export const REDIS_READINESS = Symbol("REDIS_READINESS");
export type RedisReadiness = Pick<Redis, "ping">;

export const ROOMS_REDIS = Symbol("ROOMS_REDIS");
export const ROOMS_DATABASE_READINESS = Symbol("ROOMS_DATABASE_READINESS");
export type RoomsDatabaseReadiness = Pick<RoomsDatabaseService, "ping">;
export type RoomsRedisClient = Pick<
  Redis,
  | "ping"
  | "eval"
  | "hget"
  | "hgetall"
  | "hset"
  | "hlen"
  | "ttl"
  | "zadd"
  | "zrem"
  | "zrevrange"
>;

@Injectable()
export class RoomsRedisReadiness
  implements RedisReadiness, OnApplicationShutdown
{
  readonly client: Redis;
  constructor(config: ConfigService) {
    this.client = new Redis(config.getOrThrow<string>("REDIS_URL"), {
      lazyConnect: true,
      enableOfflineQueue: false,
      maxRetriesPerRequest: 0,
      connectTimeout: 1500,
      commandTimeout: 1500,
      retryStrategy: () => null,
    });
  }
  async ping() {
    if (this.client.status === "wait" || this.client.status === "end")
      await this.client.connect();
    return this.client.ping();
  }
  onApplicationShutdown() {
    this.client.disconnect(false);
  }
}

@Controller("health")
export class HealthController {
  constructor(
    @Inject(REDIS_READINESS) private readonly redis: RedisReadiness,
    @Inject(ROOMS_DATABASE_READINESS)
    private readonly database: RoomsDatabaseReadiness,
  ) {}
  @Get("live")
  live() {
    return { status: "ok", service: "rooms" };
  }
  @Get("ready")
  async ready() {
    try {
      await this.redis.ping();
      await this.database.ping();
      roomsRedisReachable.set({ service: "rooms" }, 1);
      return { status: "ok", service: "rooms" };
    } catch {
      roomsRedisReachable.set({ service: "rooms" }, 0);
      throw new ServiceUnavailableException("Service dependency unavailable");
    }
  }
}
