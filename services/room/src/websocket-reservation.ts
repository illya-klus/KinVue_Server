import {
  Injectable,
  type OnApplicationBootstrap,
  type OnApplicationShutdown,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { WebSocketServer } from "ws";
import { createLogger } from "@kinvue/logger";

@Injectable()
export class WebSocketReservation
  implements OnApplicationBootstrap, OnApplicationShutdown
{
  private server?: WebSocketServer;
  constructor(private readonly config: ConfigService) {}
  async onApplicationBootstrap() {
    const server = new WebSocketServer({
      port: this.config.getOrThrow<number>("ROOMS_WS_PORT"),
      host: this.config.getOrThrow<string>("ROOMS_HTTP_HOST"),
      path: "/rooms",
      maxPayload: 16 * 1024,
    });
    this.server = server;
    server.on("connection", (socket) => socket.close(1003, "not-implemented"));
    server.on("error", (error) =>
      createLogger("rooms").error("WebSocket listener failed", { error }),
    );
    await new Promise<void>((resolve, reject) => {
      server.once("listening", resolve);
      server.once("error", reject);
    });
  }
  async onApplicationShutdown() {
    const server = this.server;
    if (!server) return;
    for (const socket of server.clients) socket.terminate();
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
}
