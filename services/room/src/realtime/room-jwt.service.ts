import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createJwtVerifier, JwtVerificationError } from "@kinvue/jwt";
@Injectable()
export class RoomJwtService {
  private verifier?: ReturnType<typeof createJwtVerifier>;
  private expiresAt = 0;
  private loading?: Promise<void>;
  constructor(private readonly config: ConfigService) {}
  private async load() {
    if (!this.loading)
      this.loading = (async () => {
        const base = this.config.getOrThrow<string>("AUTH_SERVICE_URL");
        const response = await fetch(new URL("/.well-known/jwks.json", base), {
          signal: AbortSignal.timeout(5000),
        });
        if (!response.ok) throw new Error("JWKS_UNAVAILABLE");
        this.verifier = createJwtVerifier(await response.json(), {
          issuer: this.config.getOrThrow("JWT_ISSUER"),
          audience: this.config.getOrThrow("JWT_AUDIENCE"),
        });
        this.expiresAt = Date.now() + 300000;
      })().finally(() => {
        this.loading = undefined;
      });
    await this.loading;
  }
  async verify(token: string) {
    if (!this.verifier || Date.now() >= this.expiresAt) await this.load();
    try {
      return await this.verifier!(token);
    } catch (error) {
      if (
        error instanceof JwtVerificationError &&
        error.reason === "UNKNOWN_KEY"
      ) {
        await this.load();
        return this.verifier!(token);
      }
      throw error;
    }
  }
}
