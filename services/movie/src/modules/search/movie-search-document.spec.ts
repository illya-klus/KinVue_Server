import { toSearchDocument } from "./movie-search-document";

describe("toSearchDocument", () => {
  it("maps published row to projection", () => {
    const doc = toSearchDocument({
      id: "m1",
      title: "Interstellar",
      description: "Space",
      genres: ["sci-fi"],
      status: "PUBLISHED",
      publish_at: new Date("2026-01-01T00:00:00.000Z"),
      created_at: new Date("2025-12-01T00:00:00.000Z"),
      updated_at: new Date("2026-01-01T00:00:00.000Z"),
    });

    expect(doc.id).toBe("m1");
    expect(doc.publicationStatus).toBe("PUBLISHED");
    expect(doc.genres).toEqual(["sci-fi"]);
  });
});
