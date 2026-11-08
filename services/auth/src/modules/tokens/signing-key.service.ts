import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createPrivateKey, createPublicKey, type KeyObject } from "node:crypto";

type PublicJwk = {
  alg: "RS256";
  e: string;
  kid: string;
  kty: "RSA";
  n: string;
  use: "sig";
  key_ops: ["verify"];
};

@Injectable()
export class SigningKeyService {
  private readonly signingKey: KeyObject;
  private readonly publicJwk: PublicJwk;

  public constructor(config: ConfigService) {
    const keyId = config.getOrThrow<string>("AUTH_JWT_KEY_ID");
    const pem = config
      .getOrThrow<string>("AUTH_JWT_PRIVATE_KEY")
      .replace(/\\n/g, "\n");

    try {
      this.signingKey = createPrivateKey(pem);
    } catch {
      throw new Error(
        "AUTH_JWT_PRIVATE_KEY must contain a valid RSA private key",
      );
    }

    const keyDetails = this.signingKey.asymmetricKeyDetails;
    if (
      this.signingKey.asymmetricKeyType !== "rsa" ||
      !keyDetails?.modulusLength ||
      keyDetails.modulusLength < 2048
    ) {
      throw new Error(
        "AUTH_JWT_PRIVATE_KEY must be an RSA key of at least 2048 bits",
      );
    }

    const exported = createPublicKey(this.signingKey).export({ format: "jwk" });
    if (!exported.n || !exported.e) {
      throw new Error("AUTH_JWT_PRIVATE_KEY did not produce a public RSA key");
    }

    this.publicJwk = {
      kty: "RSA",
      use: "sig",
      alg: "RS256",
      kid: keyId,
      n: exported.n,
      e: exported.e,
      key_ops: ["verify"],
    };
  }

  public getPrivateKey(): KeyObject {
    return this.signingKey;
  }

  public getJwks(): { keys: PublicJwk[] } {
    return { keys: [{ ...this.publicJwk, key_ops: ["verify"] }] };
  }
}
