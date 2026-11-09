import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { RpcException } from "@nestjs/microservices";
import { OAuth2Client } from "google-auth-library";
import { status } from "@grpc/grpc-js";
import { PrismaService } from "../../prisma/prisma.service.js";
import type { FieldOutputTypes } from "@/prisma/contract";

type AuthUserRow = FieldOutputTypes["public"]["AuthUser"];
type AuthIdentityRow = FieldOutputTypes["public"]["AuthIdentity"];

@Injectable()
export class AuthService {
  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}
  public async verifyGoogleToken(googleToken: string) {
    const client = new OAuth2Client(this.config.getOrThrow("GOOGLE_CLIENT_ID"));

    const ticket = await client.verifyIdToken({
      idToken: googleToken,
      audience: this.config.getOrThrow("GOOGLE_CLIENT_ID"),
    });

    const payload = ticket.getPayload();
    if (!payload)
      throw new RpcException({
        code: status.NOT_FOUND,
        message: "Invalid Google token",
      });

    const userId = payload.sub;

    return {
      userId,
      name: payload.name,
      email: payload.email,
      fullUserData: { ...payload },
    };
  }

  public async createIfNotExists(
    provider: "GOOGLE",
    providerUserId: string,
    email: string,
  ): Promise<{ user: AuthUserRow; created: boolean }> {
    const user = await this.prisma.db.orm.public.AuthUser.first({
      provider,
      providerUserId,
    });

    if (user) {
      return { user, created: false };
    }

    const created = await this.prisma.db.orm.public.AuthUser.create({
      provider,
      providerUserId,
      email,
      role: "USER",
    });
    return { user: created, created: true };
  }

  public async findLoginIdentityByEmail(
    email: string,
  ): Promise<AuthIdentityRow | null> {
    return (
      (await this.prisma.db.orm.public.AuthIdentity.first({
        email: email.trim().toLowerCase(),
      })) ?? null
    );
  }
}
