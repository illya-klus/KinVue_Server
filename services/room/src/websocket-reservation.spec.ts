import { EventEmitter } from "node:events";
import { ConfigService } from "@nestjs/config";
import WebSocket from "ws";
import { WebSocketReservation } from "./websocket-reservation";
describe("Rooms WebSocket handshake", () => {
  let service: WebSocketReservation;
  beforeAll(async () => {
    const subscriber = Object.assign(new EventEmitter(), {
      connect: jest.fn().mockResolvedValue(undefined),
      subscribe: jest.fn().mockResolvedValue(undefined),
      unsubscribe: jest.fn().mockResolvedValue(undefined),
      disconnect: jest.fn(),
    });
    service = new WebSocketReservation(
      new ConfigService({ ROOMS_HTTP_HOST: "127.0.0.1", ROOMS_WS_PORT: 0 }),
      {
        verify: jest.fn().mockResolvedValue({
          userId: "ca909eab-586e-4a1a-8c0e-4a8ce57a2b35",
        }),
      } as never,
      {
        join: jest.fn().mockResolvedValue({
          type: "room.state_sync",
          roomId: "61c316d0-148d-4139-a6f0-231025742d04",
          role: "OWNER",
          version: 0,
        }),
        sweep: jest.fn(),
      } as never,
      {
        ping: jest.fn().mockResolvedValue("PONG"),
        client: { duplicate: () => subscriber },
      } as never,
    );
    await service.onApplicationBootstrap();
  });
  afterAll(async () => service.onApplicationShutdown());
  it("rejects upgrades without a token and room identifier", async () => {
    const address = service.address() as { port: number };
    await new Promise<void>((resolve, reject) => {
      const ws = new WebSocket(`ws://127.0.0.1:${address.port}/rooms`);
      ws.once("unexpected-response", (_request, response) => {
        expect(response.statusCode).toBe(401);
        response.resume();
        ws.terminate();
        resolve();
      });
      ws.on("error", () => {});
      ws.once("open", () => reject(new Error("Unauthenticated socket opened")));
    });
  });
  it("sends state_sync as the first frame after a successful join", async () => {
    const address = service.address() as { port: number };
    const ws = new WebSocket(
      `ws://127.0.0.1:${address.port}/rooms?roomId=61c316d0-148d-4139-a6f0-231025742d04&token=fixture`,
    );
    const event = await new Promise<string>((resolve, reject) => {
      ws.once("message", (data) => resolve(data.toString()));
      ws.once("error", reject);
    });
    expect(JSON.parse(event)).toMatchObject({
      type: "room.state_sync",
      role: "OWNER",
      version: 0,
    });
    ws.close();
  });
});
