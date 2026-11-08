import { HttpException, HttpStatus } from "@nestjs/common";

export class UpstreamUnavailableException extends HttpException {
  constructor(message = "Meilisearch is unavailable.") {
    super(
      {
        statusCode: HttpStatus.SERVICE_UNAVAILABLE,
        error: "UPSTREAM_UNAVAILABLE",
        message,
      },
      HttpStatus.SERVICE_UNAVAILABLE,
    );
  }
}
