import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import pg from "pg";

export type NotificationRow = {
  notification_id: string;
  recipient_id: string;
  type: string;
  payload: Record<string, unknown>;
  read_at: Date | null;
  created_at: Date;
};

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DatabaseService.name);
  private pool!: pg.Pool;

  constructor(private readonly config: ConfigService) {}

  public async onModuleInit(): Promise<void> {
    this.pool = new pg.Pool({
      connectionString: this.config.getOrThrow<string>(
        "NOTIFICATIONS_DATABASE_URL",
      ),
    });
    await this.runMigrations();
  }

  public async onModuleDestroy(): Promise<void> {
    await this.pool?.end();
  }

  public query<T extends pg.QueryResultRow>(
    text: string,
    params?: unknown[],
  ): Promise<pg.QueryResult<T>> {
    return this.pool.query<T>(text, params);
  }

  private async runMigrations(): Promise<void> {
    const sqlPath = join(process.cwd(), "migrations", "001_notifications.sql");
    const sql = readFileSync(sqlPath, "utf8");
    await this.pool.query(sql);
    this.logger.log("Notifications database migrations applied");
  }
}
