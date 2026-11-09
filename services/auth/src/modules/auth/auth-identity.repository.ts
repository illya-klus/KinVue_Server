import { ConflictException, Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service.js";
import type { FieldOutputTypes } from "@/prisma/contract";

type AuthIdentityRow = FieldOutputTypes["public"]["AuthIdentity"];

@Injectable()
export class AuthIdentityRepository {
  public constructor(private readonly prisma: PrismaService) {}

  public async createPending(
    userId: string,
    email: string,
    passwordHash: string,
  ): Promise<AuthIdentityRow> {
    try {
      return await this.prisma.db.orm.public.AuthIdentity.create({
        userId,
        email,
        passwordHash,
        status: "PENDING",
      });
    } catch (error) {
      if (this.isDuplicateEmail(error)) {
        throw new ConflictException("Email is already registered");
      }
      throw error;
    }
  }

  public async transitionStatus(
    userId: string,
    expectedStatus: "PENDING" | "PROFILE_CREATING",
    nextStatus: "PROFILE_CREATING" | "ACTIVE",
  ): Promise<void> {
    const result = await this.prisma.pool.query(
      `UPDATE public.auth_identities
       SET status = $3, updated_at = NOW()
       WHERE user_id = $1 AND status = $2`,
      [userId, expectedStatus, nextStatus],
    );
    if (result.rowCount !== 1) {
      throw new ConflictException("Registration identity state changed");
    }
  }

  public async compensateRegistration(userId: string): Promise<void> {
    const started = await this.prisma.pool.query(
      `UPDATE public.auth_identities
       SET status = 'COMPENSATING', updated_at = NOW()
       WHERE user_id = $1 AND status = 'PROFILE_CREATING'`,
      [userId],
    );
    if (started.rowCount !== 1) {
      throw new ConflictException(
        "Registration identity cannot be compensated",
      );
    }

    const completed = await this.prisma.pool.query(
      `UPDATE public.auth_identities
       SET status = 'COMPENSATED', email = NULL, password_hash = NULL,
           updated_at = NOW()
       WHERE user_id = $1 AND status = 'COMPENSATING'`,
      [userId],
    );
    if (completed.rowCount !== 1) {
      throw new ConflictException("Registration compensation did not complete");
    }
  }

  private isDuplicateEmail(error: unknown): boolean {
    if (!error || typeof error !== "object") return false;
    const value = error as {
      code?: unknown;
      constraint?: unknown;
      meta?: { target?: unknown };
    };
    if (value.code === "23505") {
      return value.constraint === "auth_identities_email_key";
    }
    return (
      value.code === "P2002" &&
      (value.meta?.target === "email" ||
        (Array.isArray(value.meta?.target) &&
          value.meta.target.includes("email")))
    );
  }
}
