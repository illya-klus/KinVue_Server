import { Injectable, type OnApplicationShutdown } from "@nestjs/common";
import { db, pool } from "./db.js";

@Injectable()
export class PrismaService implements OnApplicationShutdown {
  public readonly db = db;
  public readonly pool = pool;
  async checkReadiness() {
    await pool.query("SELECT 1");
  }
  async onApplicationShutdown() {
    await pool.end();
  }
}
