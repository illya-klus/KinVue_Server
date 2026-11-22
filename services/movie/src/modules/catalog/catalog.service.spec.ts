import { CatalogService } from "./catalog.service";
describe("scheduled publication recovery", () => {
  it("continues the batch after a database error and retries the failed movie next run", async () => {
    const now = new Date();
    const row = {
      id: "second",
      title: "Movie",
      description: "Test",
      genres: ["Drama"],
      status: "PUBLISHED",
      publish_at: now,
      created_at: now,
      updated_at: now,
    };
    const movies = {
      findDue: jest.fn().mockResolvedValue([{ id: "first" }, { id: "second" }]),
      publish: jest
        .fn()
        .mockRejectedValueOnce(new Error("temporary database error"))
        .mockResolvedValue(row),
    };
    const index = {
      upsertPublishedMovie: jest.fn().mockResolvedValue(undefined),
    };
    const service = new CatalogService(movies as never, index as never);
    await service.publishDue();
    expect(index.upsertPublishedMovie).toHaveBeenCalledTimes(1);
    movies.findDue.mockResolvedValue([{ id: "first" }]);
    movies.publish.mockResolvedValue({ ...row, id: "first" });
    await service.publishDue();
    expect(movies.publish).toHaveBeenCalledWith("first");
    expect(index.upsertPublishedMovie).toHaveBeenCalledTimes(2);
    expect(index.upsertPublishedMovie).toHaveBeenLastCalledWith(
      expect.objectContaining({ id: "first" }),
    );
  });
});
