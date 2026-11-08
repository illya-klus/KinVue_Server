import { RECONCILE_OVERLAP_MS, reconcileWindow } from "./reconcile-window";

describe("reconcileWindow", () => {
  it("uses overlap from last success", () => {
    const jobStartedAt = new Date("2026-01-10T12:00:00.000Z");
    const last = new Date("2026-01-09T12:00:00.000Z");

    const { from, to } = reconcileWindow(jobStartedAt, last);
    expect(to).toEqual(jobStartedAt);
    expect(from.getTime()).toBe(last.getTime() - RECONCILE_OVERLAP_MS);
  });

  it("starts from epoch when checkpoint missing", () => {
    const jobStartedAt = new Date("2026-01-10T12:00:00.000Z");
    const { from, to } = reconcileWindow(jobStartedAt, undefined);
    expect(to).toEqual(jobStartedAt);
    expect(from.getTime()).toBe(0);
  });
});
