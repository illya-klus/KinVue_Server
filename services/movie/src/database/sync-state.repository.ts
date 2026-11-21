import { Injectable } from "@nestjs/common";
import { DatabaseService } from "./database.service";

@Injectable()
export class SyncStateRepository {
  constructor(private readonly db: DatabaseService) {}

  public async getLastSuccessfulSync(): Promise<Date | undefined> {
    await this.db.query(
      `INSERT INTO movie_index_sync_state (id) VALUES ('movies') ON CONFLICT DO NOTHING`,
    );
    const result = await this.db.query<{
      last_successful_sync: Date | null;
    }>(
      `SELECT last_successful_sync FROM movie_index_sync_state WHERE id = 'movies'`,
    );
    const row = result.rows[0];
    return row?.last_successful_sync ?? undefined;
  }

  public async setLastSuccessfulSync(at: Date): Promise<void> {
    await this.db.query(
      `INSERT INTO movie_index_sync_state (id, last_successful_sync) VALUES ('movies', $1)
       ON CONFLICT (id) DO UPDATE SET last_successful_sync = EXCLUDED.last_successful_sync`,
      [at],
    );
  }
}
