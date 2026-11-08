import { AppError } from "@kinvue/errors";
import { MoviesSearchService } from "./movies-search.service";

describe("MoviesSearchService", () => {
  it("maps Meilisearch failure to UPSTREAM_UNAVAILABLE", async () => {
    const meili = {
      index: () => ({
        search: jest.fn().mockRejectedValue(new Error("down")),
      }),
    };

    const service = new MoviesSearchService(meili as never);
    await expect(
      service.search({ limit: 10, offset: 0 }),
    ).rejects.toBeInstanceOf(AppError);
    await expect(service.search({ limit: 10, offset: 0 })).rejects.toMatchObject({
      code: "UPSTREAM_UNAVAILABLE",
    });
  });
});
