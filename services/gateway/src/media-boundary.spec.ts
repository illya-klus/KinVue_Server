import { matchProxyRoute } from "./modules/proxy/proxy-routes";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

describe("media bytes bypass application services", () => {
  it("routes authenticated access control but exposes no playlist/segment routes", () => {
    const id = "550e8400-e29b-41d4-a716-446655440000";
    expect(
      matchProxyRoute("POST", `/api/movies/${id}/media-access`)?.auth,
    ).toBe("required");
    for (const path of [
      `/api/movies/${id}/hls/master.m3u8`,
      `/api/movies/${id}/hls/segment.ts`,
      "/kinvue-media/movies/test.ts",
    ])
      expect(matchProxyRoute("GET", path)).toBeUndefined();
  });
  it("keeps Movie HTTP handlers free of object-byte responses", () => {
    const root = join(__dirname, "../../movie/src");
    const walk = (dir: string): string[] =>
      readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
        entry.isDirectory()
          ? walk(join(dir, entry.name))
          : [join(dir, entry.name)],
      );
    for (const file of walk(root).filter(
      (file) => file.endsWith(".ts") && !file.endsWith(".spec.ts"),
    )) {
      const source = readFileSync(file, "utf8");
      if (!source.includes("@Controller")) continue;
      expect(source).not.toMatch(
        /StreamableFile|\.pipe\(\s*(?:res|response)\b|sendFile\(|video\/mp2t/i,
      );
    }
  });
});
