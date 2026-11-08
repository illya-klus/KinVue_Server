import {
  sendUpstreamUnavailable,
  UPSTREAM_UNAVAILABLE_BODY,
} from "./upstream-unavailable";
import type { Response } from "express";

describe("sendUpstreamUnavailable", () => {
  it("writes standard 503 body", () => {
    let status = 0;
    let payload: unknown;
    const res = {
      headersSent: false,
      status(code: number) {
        status = code;
        return this;
      },
      json(body: unknown) {
        payload = body;
      },
    } as unknown as Response;

    sendUpstreamUnavailable(res);

    expect(status).toBe(503);
    expect(payload).toEqual(UPSTREAM_UNAVAILABLE_BODY);
  });

  it("skips when headers already sent", () => {
    const res = {
      headersSent: true,
      status: jest.fn(),
      json: jest.fn(),
    } as unknown as Response;

    sendUpstreamUnavailable(res);

    expect(res.status).not.toHaveBeenCalled();
  });
});
