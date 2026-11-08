import { Injectable } from "@nestjs/common";
import { DatabaseService } from "./database.service";

@Injectable()
export class SyncStateRepository {
  constructor(private readonly db: DatabaseService) {}

  public async getLastSuccessfulSync(): Promise<Date | undefined> {
    const result = await this.db.query<{
      last_successful_sync: Date | null;
    }>(
      `SELECT last_successful_sync FROM movie_index_sync_state WHERE id = 'default'`,
    );
    const row = result.rows[0];
    return row?.last_successful_sync ?? undefined;
  }

  public async setLastSuccessfulSync(at: Date): Promise<void> {
    await this.db.query(
      `UPDATE movie_index_sync_state SET last_successful_sync = $1 WHERE id = 'default'`,
      [at],
    );
  }
}
