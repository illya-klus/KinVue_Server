import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { UpstreamName } from "./proxy.types";

@Injectable()
export class UpstreamService {
  constructor(private readonly config: ConfigService) {}

  public baseUrl(upstream: UpstreamName): string {
    const map: Record<UpstreamName, string> = {
      auth: "AUTH_SERVICE_URL",
      users: "USERS_SERVICE_URL",
      movie: "MOVIE_SERVICE_URL",
      rooms: "ROOMS_SERVICE_URL",
    };
    return this.config.getOrThrow<string>(map[upstream]);
  }
}
