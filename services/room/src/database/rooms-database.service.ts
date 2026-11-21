import {
  Injectable,
  Logger,
  type OnModuleDestroy,
  type OnModuleInit,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import pg from "pg";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

@Injectable()
export class RoomsDatabaseService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RoomsDatabaseService.name);
  private pool!: pg.Pool;

  constructor(private readonly config: ConfigService) {}

  async onModuleInit() {
    this.pool = new pg.Pool({
      connectionString: this.config.getOrThrow<string>("ROOMS_DATABASE_URL"),
      max: 10,
      connectionTimeoutMillis: 5000,
    });
    await this.pool.query("SELECT 1");
    const sql = await readFile(
      join(process.cwd(), "migrations", "001_room_invites_outbox.sql"),
      "utf8",
    );
    await this.pool.query(sql);
    this.logger.log("Rooms database migrations applied");
  }

  async onModuleDestroy() {
    await this.pool?.end();
  }

  query<T extends pg.QueryResultRow>(text: string, values?: unknown[]) {
    return this.pool.query<T>(text, values);
  }

  connect() {
    return this.pool.connect();
  }

  ping() {
    return this.pool.query("SELECT 1");
  }
}
