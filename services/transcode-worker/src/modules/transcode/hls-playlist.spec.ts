import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("HLS master playlist fixture", () => {
  it("parses a minimal master.m3u8 sample", () => {
    const sample = join(__dirname, "fixtures", "master.m3u8");
    const text = readFileSync(sample, "utf8");
    expect(text).toContain("#EXTM3U");
    expect(text).toMatch(/#EXT-X-STREAM-INF:/);
  });
});
