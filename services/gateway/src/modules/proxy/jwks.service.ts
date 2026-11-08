import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { importJWK, JWK } from "jose";

const CACHE_MS = 5 * 60 * 1000;

@Injectable()
export class JwksService {
  private readonly logger = new Logger(JwksService.name);
  private keys = new Map<string, CryptoKey>();
  private loadedAt = 0;

  constructor(private readonly config: ConfigService) {}

  public async getKey(kid: string, forceRefresh = false): Promise<CryptoKey> {
    if (forceRefresh || Date.now() - this.loadedAt > CACHE_MS) {
      await this.refresh();
    }

    const key = this.keys.get(kid);
    if (key) {
      return key;
    }

    await this.refresh(true);
    const retried = this.keys.get(kid);
    if (!retried) {
      throw new Error(`Unknown kid: ${kid}`);
    }
    return retried;
  }

  private async refresh(logRefresh = false): Promise<void> {
    const base = this.config.getOrThrow<string>("AUTH_SERVICE_URL");
    const url = new URL("/.well-known/jwks.json", base).toString();

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`JWKS fetch failed with ${response.status}`);
    }

    const body = (await response.json()) as { keys?: JWK[] };
    const next = new Map<string, CryptoKey>();

    for (const jwk of body.keys ?? []) {
      if (!jwk.kid) {
        continue;
      }
      const key = await importJWK(jwk, jwk.alg ?? "RS256");
      if (key instanceof CryptoKey) {
        next.set(jwk.kid, key);
      }
    }

    this.keys = next;
    this.loadedAt = Date.now();
    if (logRefresh) {
      this.logger.log(`JWKS refreshed (${next.size} keys)`);
    }
  }
}
