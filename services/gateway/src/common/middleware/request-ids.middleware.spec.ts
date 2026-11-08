import { RequestIdMiddleware } from "./request-ids.middleware";
import type { Request, Response } from "express";

describe("RequestIdMiddleware", () => {
  const middleware = new RequestIdMiddleware();

  it("generates id when header missing", () => {
    const req = {
      header: () => undefined,
    } as unknown as Request;
    const headers: Record<string, string> = {};
    const res = {
      setHeader: (k: string, v: string) => (headers[k] = v),
    } as unknown as Response;
    let nextCalled = false;

    middleware.use(req, res, () => {
      nextCalled = true;
    });

    expect(nextCalled).toBe(true);
    expect(req.requestId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
    expect(headers["x-request-id"]).toBe(req.requestId);
  });

  it("accepts sane client request id", () => {
    const req = {
      header: () => "client-req-42",
    } as unknown as Request;
    const res = { setHeader: jest.fn() } as unknown as Response;

    middleware.use(req, res, () => undefined);

    expect(req.requestId).toBe("client-req-42");
  });

  it("replaces invalid request id", () => {
    const req = {
      header: () => "bad id with spaces",
    } as unknown as Request;
    const res = { setHeader: jest.fn() } as unknown as Response;

    middleware.use(req, res, () => undefined);

    expect(req.requestId).not.toBe("bad id with spaces");
  });
});
