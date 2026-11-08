import { MovieReconcileService } from "./movie-reconcile.service";

describe("MovieReconcileService checkpoint", () => {
  it("does not move checkpoint when upsert fails", async () => {
    const syncState = {
      getLastSuccessfulSync: jest.fn().mockResolvedValue(undefined),
      setLastSuccessfulSync: jest.fn(),
    };
    const movies = {
      listPublishedUpdatedBetween: jest
        .fn()
        .mockResolvedValue([{ id: "m1", status: "PUBLISHED" }]),
    };
    const indexer = {
      upsertPublishedMovie: jest.fn().mockRejectedValue(new Error("meili")),
    };

    const service = new MovieReconcileService(
      movies as never,
      syncState as never,
      indexer as never,
    );

    await expect(service.runIncremental(new Date())).rejects.toThrow("meili");
    expect(syncState.setLastSuccessfulSync).not.toHaveBeenCalled();
  });
});
