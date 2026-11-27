import { ConfigService } from "@nestjs/config";
import { NotFoundException } from "@nestjs/common";
import { MediaAccessService } from "./media-access.service";

describe("MediaAccessService", () => {
  const readyMovie = {
    id: "movie-1",
    title: "Playable movie",
    description: "",
    genres: [],
    status: "PUBLISHED",
    media_status: "READY",
    hls_master_key: "movies/movie-1/hls/master.m3u8",
    publish_at: new Date(),
    created_at: new Date(),
    updated_at: new Date(),
  };

  function createService(movie: typeof readyMovie | null = readyMovie) {
    const movies = {
      findById: jest.fn().mockResolvedValue(movie ?? undefined),
    };
    const values: Record<string, string> = {
      S3_BUCKET: "kinvue-media",
      S3_ENDPOINT: "http://127.0.0.1:9000",
      S3_PUBLIC_ENDPOINT: "https://media.example.test",
      S3_ACCESS_KEY: "test-access",
      S3_SECRET_KEY: "test-secret",
    };
    const config = {
      get: jest.fn((key: string) => values[key]),
      getOrThrow: jest.fn((key: string) => values[key]),
    };
    return {
      service: new MediaAccessService(
        config as unknown as ConfigService,
        movies as never,
      ),
      movies,
    };
  }

  it("returns a 10-minute signed URL only for published, ready media", async () => {
    const { service, movies } = createService();
    const before = Date.now();
    const storage = (service as unknown as { storage: { send: jest.Mock } })
      .storage;
    storage.send = jest.fn().mockImplementation(async (command) =>
      command.constructor.name === "GetObjectCommand"
        ? {
            ContentLength: 8,
            Body: { transformToString: async () => "#EXTM3U\n" },
          }
        : {},
    );

    const access = await service.createAccess("movie-1");
    const signedUrl = new URL(access.url);

    expect(movies.findById).toHaveBeenCalledWith("movie-1");
    expect(signedUrl.origin).toBe("https://media.example.test");
    expect(signedUrl.pathname).toMatch(
      /^\/kinvue-media\/_access\/[^/]+\/master\.m3u8$/,
    );
    expect(signedUrl.searchParams.get("X-Amz-Expires")).toBe("600");
    expect(Date.parse(access.expiresAt)).toBeGreaterThanOrEqual(
      before + 600_000,
    );
  });

  it.each([
    ["draft", { ...readyMovie, status: "DRAFT" }],
    ["processing", { ...readyMovie, media_status: "PROCESSING" }],
    ["without a master playlist", { ...readyMovie, hls_master_key: null }],
    ["missing", null],
  ])("does not sign %s media", async (_label, movie) => {
    const { service } = createService(movie as typeof readyMovie | null);

    await expect(service.createAccess("movie-1")).rejects.toThrow(
      NotFoundException,
    );
  });
});
