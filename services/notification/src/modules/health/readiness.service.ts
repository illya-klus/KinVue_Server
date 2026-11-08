import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import amqp from "amqplib";

@Injectable()
export class ReadinessService {
  constructor(private readonly config: ConfigService) {}

  public async check(): Promise<Record<string, string>> {
    const url = this.config.get<string>("RABBITMQ_URL");
    if (!url) {
      return { rabbitmq: "missing_config" };
    }

    try {
      const connection = await amqp.connect(url);
      await connection.close();
      return { rabbitmq: "ok" };
    } catch {
      return { rabbitmq: "unreachable" };
    }
  }
}
