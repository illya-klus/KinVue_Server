import { Injectable, type LoggerService } from "@nestjs/common";
import { createLogger } from "@kinvue/logger";

@Injectable()
export class SharedLogger implements LoggerService {
  private readonly logger = createLogger("rooms");
  log(message: unknown, ...optionalParams: unknown[]) {
    this.logger.info(String(message), { details: optionalParams });
  }
  error(message: unknown, ...optionalParams: unknown[]) {
    this.logger.error(String(message), { details: optionalParams });
  }
  warn(message: unknown, ...optionalParams: unknown[]) {
    this.logger.warn(String(message), { details: optionalParams });
  }
  debug(message: unknown, ...optionalParams: unknown[]) {
    this.logger.debug(String(message), { details: optionalParams });
  }
  verbose(message: unknown, ...optionalParams: unknown[]) {
    this.logger.debug(String(message), { details: optionalParams });
  }
  fatal(message: unknown, ...optionalParams: unknown[]) {
    this.logger.error(String(message), { details: optionalParams });
  }
  setContext(context: string) {
    this.logger.info("logger context set", { context });
  }
}
