import {
  createLocalJWKSet,
  decodeProtectedHeader,
  errors,
  jwtVerify,
  type JSONWebKeySet,
} from "jose";
export type JwtFailure =
  | "EXPIRED"
  | "INVALID_SIGNATURE"
  | "INVALID_ISSUER"
  | "INVALID_AUDIENCE"
  | "MISSING_SCOPE"
  | "UNKNOWN_KEY"
  | "INVALID_TOKEN";
export class JwtVerificationError extends Error {
  readonly reason: JwtFailure;
  constructor(reason: JwtFailure) {
    super(`JWT validation failed: ${reason}`);
    this.name = "JwtVerificationError";
    this.reason = reason;
  }
}
export interface VerifiedIdentity {
  userId: string;
  scopes: string[];
}

/** Pure local verification: no fetch, discovery, introspection, or remote JWKS resolver. */
export function createJwtVerifier(
  jwks: JSONWebKeySet,
  options: { issuer: string; audience: string; now?: () => Date },
) {
  if (!options.issuer || !options.audience)
    throw new Error("JWT issuer and audience are required");
  const keys = createLocalJWKSet(structuredClone(jwks));
  return async (
    token: string,
    requiredScopes: readonly string[] = [],
  ): Promise<VerifiedIdentity> => {
    try {
      const header = decodeProtectedHeader(token);
      if (
        header.alg !== "RS256" ||
        typeof header.kid !== "string" ||
        !header.kid
      )
        throw new JwtVerificationError("INVALID_TOKEN");
      const { payload } = await jwtVerify(token, keys, {
        algorithms: ["RS256"],
        issuer: options.issuer,
        audience: options.audience,
        requiredClaims: ["sub", "exp", "iat", "iss", "aud"],
        ...(options.now ? { currentDate: options.now() } : {}),
      });
      if (
        typeof payload.sub !== "string" ||
        !payload.sub ||
        typeof payload.iat !== "number" ||
        payload.iat >
          Math.floor((options.now?.() ?? new Date()).getTime() / 1000)
      )
        throw new JwtVerificationError("INVALID_TOKEN");
      if (
        !Array.isArray(payload.scopes) ||
        payload.scopes.some((scope) => typeof scope !== "string" || !scope)
      )
        throw new JwtVerificationError("INVALID_TOKEN");
      const scopes = payload.scopes as string[];
      if (requiredScopes.some((scope) => !scopes.includes(scope)))
        throw new JwtVerificationError("MISSING_SCOPE");
      return { userId: payload.sub, scopes: [...new Set(scopes)] };
    } catch (error) {
      if (error instanceof JwtVerificationError) throw error;
      if (error instanceof errors.JWTExpired)
        throw new JwtVerificationError("EXPIRED");
      if (error instanceof errors.JWSSignatureVerificationFailed)
        throw new JwtVerificationError("INVALID_SIGNATURE");
      if (error instanceof errors.JWKSNoMatchingKey)
        throw new JwtVerificationError("UNKNOWN_KEY");
      if (
        error instanceof errors.JWTClaimValidationFailed &&
        error.claim === "iss"
      )
        throw new JwtVerificationError("INVALID_ISSUER");
      if (
        error instanceof errors.JWTClaimValidationFailed &&
        error.claim === "aud"
      )
        throw new JwtVerificationError("INVALID_AUDIENCE");
      throw new JwtVerificationError("INVALID_TOKEN");
    }
  };
}
