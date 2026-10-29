import { Test } from "@nestjs/testing";
import type { INestApplication } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import WebSocket, { WebSocketServer } from "ws";
import { WebSocketReservation } from "./websocket-reservation";

describe("Rooms WebSocket reservation", () => {
  let app: INestApplication;
  let reservation: WebSocketReservation;
  beforeAll(async () => {
    const module = await Test.createTestingModule({
      providers: [
        WebSocketReservation,
        { provide: ConfigService, useValue: { getOrThrow: () => 0 } },
      ],
    }).compile();
    app = module.createNestApplication();
    reservation = module.get(WebSocketReservation);
    await reservation.onApplicationBootstrap();
  });
  afterAll(async () => {
    await reservation.onApplicationShutdown();
    await app.close();
  });
  it("accepts an upgrade and closes with not-implemented without room rules", async () => {
    const server = (reservation as unknown as { server: WebSocketServer })
      .server;
    const address = server.address();
    expect(address && typeof address === "object").toBe(true);
    const socket = new WebSocket(
      `ws://127.0.0.1:${(address as { port: number }).port}/rooms`,
    );
    const closed = await new Promise<{ code: number; reason: string }>(
      (resolve, reject) => {
        socket.once("error", reject);
        socket.once("close", (code, reason) =>
          resolve({ code, reason: reason.toString() }),
        );
      },
    );
    expect(closed).toEqual({ code: 1003, reason: "not-implemented" });
  });
});
