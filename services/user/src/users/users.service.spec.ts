import { UsersService, decodeCursor, encodeCursor } from "./users.service";
import type { ProfileDoc } from "./users.types";

const ME = "550e8400-e29b-41d4-a716-446655440001";

function profile(username: string): ProfileDoc {
  return {
    _id: `550e8400-e29b-41d4-a716-4466554400${username.length}${username.charCodeAt(0)}`,
    username,
    displayName: username.toUpperCase(),
    avatarUrl: null,
    preferences: { genres: [], languages: [], autoplay: true },
    createdAt: new Date("2026-11-08T09:00:00.000Z"),
    updatedAt: new Date("2026-11-08T09:00:00.000Z"),
  };
}

describe("UsersService", () => {
  const repo = {
    findById: jest.fn(),
    update: jest.fn(),
    create: jest.fn(),
    search: jest.fn(),
  };
  const service = new UsersService(repo as never);
  beforeEach(() => jest.resetAllMocks());

  it("returns the client profile shape and 404s when missing", async () => {
    repo.findById.mockResolvedValueOnce(profile("alice"));
    await expect(service.getMe(ME)).resolves.toMatchObject({
      username: "alice",
      avatarUrl: null,
      createdAt: "2026-11-08T09:00:00.000Z",
    });
    repo.findById.mockResolvedValueOnce(null);
    await expect(service.getMe(ME)).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
  });

  it("rejects unknown PATCH fields", async () => {
    await expect(
      service.updateMe(ME, { username: "hacker" }),
    ).rejects.toMatchObject({ code: "VALIDATION_FAILED" });
    expect(repo.update).not.toHaveBeenCalled();
  });

  it("paginates search with an opaque username cursor", async () => {
    repo.search.mockResolvedValue([
      profile("aa"),
      profile("ab"),
      profile("ac"),
    ]);
    const page = await service.search(ME, { query: "a", limit: "2" });
    expect(page.items.map((i) => i.username)).toEqual(["aa", "ab"]);
    expect(page.nextCursor).toBe(encodeCursor("ab"));
    expect(repo.search).toHaveBeenCalledWith(
      expect.objectContaining({ limit: 3, excludeUserId: ME }),
    );

    repo.search.mockResolvedValue([profile("ac")]);
    const last = await service.search(ME, {
      query: "a",
      limit: "2",
      cursor: page.nextCursor!,
    });
    expect(last.nextCursor).toBeNull();
    expect(repo.search).toHaveBeenLastCalledWith(
      expect.objectContaining({ afterUsername: "ab" }),
    );
  });

  it("validates search parameters", async () => {
    for (const params of [
      {},
      { query: "  " },
      { query: "a", limit: "0" },
      { query: "a", limit: "abc" },
      { query: "a", cursor: "***" },
    ]) {
      await expect(service.search(ME, params)).rejects.toMatchObject({
        code: "VALIDATION_FAILED",
      });
    }
    expect(() => decodeCursor("")).toThrow();
  });
});
