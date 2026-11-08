import { Injectable } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { PrismaService } from "../../prisma/prisma.service.js";

@Injectable()
export class RefreshSessionRepository {
  public constructor(private readonly prisma: PrismaService) {}

  public async revoke(tokenHash: string): Promise<void> {
    await this.prisma.pool.query(
      `UPDATE public.refresh_sessions
       SET revoked_at = COALESCE(revoked_at, NOW()), updated_at = NOW()
       WHERE token_hash = $1`,
      [tokenHash],
    );
  }

  public async rotate(tokenHash: string, nextTokenHash: string) {
    const client = await this.prisma.pool.connect();
    const nextId = randomUUID();
    try {
      await client.query("BEGIN");
      const result = await client.query<{ id: string; user_id: string }>(
        `UPDATE public.refresh_sessions
         SET revoked_at = NOW(), updated_at = NOW()
         WHERE token_hash = $1 AND revoked_at IS NULL AND expires_at > NOW()
         RETURNING id, user_id`,
        [tokenHash],
      );
      const current = result.rows[0];
      if (!current) {
        await client.query("ROLLBACK");
        return null;
      }

      await client.query(
        `INSERT INTO public.refresh_sessions
          (id, user_id, token_hash, expires_at, revoked_at,
           rotated_from_session_id, created_at, updated_at)
         VALUES ($1, $2, $3, NOW() + INTERVAL '30 days', NULL, $4, NOW(), NOW())`,
        [nextId, current.user_id, nextTokenHash, current.id],
      );
      await client.query("COMMIT");
      return { userId: current.user_id, sessionId: nextId };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
}
