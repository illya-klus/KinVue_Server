import {
  BadGatewayException,
  ConflictException,
  Injectable,
  ServiceUnavailableException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

export interface CreateUserProfileInput {
  userId: string;
  username: string;
  displayName: string;
}

@Injectable()
export class UsersProfileClient {
  public constructor(private readonly config: ConfigService) {}

  public async createProfile(input: CreateUserProfileInput): Promise<void> {
    let response: Response;
    try {
      const endpoint = new URL(
        "/internal/profiles",
        this.config.getOrThrow<string>("USERS_INTERNAL_URL"),
      );
      response = await fetch(endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(input),
        signal: AbortSignal.timeout(5000),
      });
    } catch {
      throw new ServiceUnavailableException(
        "Users profile service unavailable",
      );
    }

    if (response.status === 409) {
      throw new ConflictException("Username is already taken");
    }
    if (response.status === 503) {
      throw new ServiceUnavailableException(
        "Users profile service unavailable",
      );
    }
    if (!response.ok) {
      throw new BadGatewayException("Users profile request failed");
    }

    let profile: unknown;
    try {
      profile = await response.json();
    } catch {
      throw new BadGatewayException("Users returned an invalid profile");
    }
    if (
      !profile ||
      typeof profile !== "object" ||
      (profile as { userId?: unknown }).userId !== input.userId
    ) {
      throw new BadGatewayException("Users returned an invalid profile");
    }
  }
}
