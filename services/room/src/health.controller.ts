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

export const REDIS_READINESS = Symbol("REDIS_READINESS");
export type RedisReadiness = Pick<Redis, "ping">;

@Injectable()
export class RoomsRedisReadiness
  implements RedisReadiness, OnApplicationShutdown
{
  private readonly client: Redis;
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
  ping() {
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
  ) {}
  @Get("live")
  live() {
    return { status: "ok", service: "rooms" };
  }
  @Get("ready")
  async ready() {
    try {
      await this.redis.ping();
      return { status: "ok", service: "rooms" };
    } catch {
      throw new ServiceUnavailableException("Service dependency unavailable");
    }
  }
}
