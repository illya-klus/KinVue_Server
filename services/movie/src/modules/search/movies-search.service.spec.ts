import { AppError } from "@kinvue/errors";
import { MoviesSearchService } from "./movies-search.service";

describe("MoviesSearchService", () => {
  it("rejects a short query before contacting Meilisearch", async () => {
    const index = jest.fn();
    const service = new MoviesSearchService({ index } as never);
    await expect(
      service.search({ q: " x ", limit: 20, offset: 0 }),
    ).rejects.toThrow("Search requires at least 2 characters");
    expect(index).not.toHaveBeenCalled();
  });
  it("maps Meilisearch failure to UPSTREAM_UNAVAILABLE", async () => {
    const meili = {
      index: () => ({
        search: jest.fn().mockRejectedValue(new Error("down")),
      }),
    };

    const service = new MoviesSearchService(meili as never);
    await expect(
      service.search({ q: "film", limit: 10, offset: 0 }),
    ).rejects.toBeInstanceOf(AppError);
    await expect(
      service.search({ q: "film", limit: 10, offset: 0 }),
    ).rejects.toMatchObject({
      code: "UPSTREAM_UNAVAILABLE",
    });
  });
});
