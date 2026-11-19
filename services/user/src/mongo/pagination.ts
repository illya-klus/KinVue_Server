import { AppError } from "@kinvue/errors";

export type Cursor = { createdAt: Date; _id: string };
export type PageOptions = { limit: number; after?: Cursor };
export type PageQuery = { limit?: string; cursor?: string };

export function encodeCursor(row: Cursor): string {
  return Buffer.from(
    JSON.stringify([row.createdAt.toISOString(), row._id]),
  ).toString("base64url");
}

export function pageOptions({ limit, cursor }: PageQuery): PageOptions {
  const invalid = () => new AppError("VALIDATION_FAILED", "Invalid pagination");
  const size = limit === undefined ? 20 : Number(limit);
  if (
    limit !== undefined &&
    (typeof limit !== "string" || !/^\d+$/.test(limit) || size < 1 || size > 50)
  ) {
    throw invalid();
  }
  if (cursor === undefined) return { limit: size };
  if (typeof cursor !== "string" || cursor.length > 128) throw invalid();
  try {
    const [time, id] = JSON.parse(
      Buffer.from(cursor, "base64url").toString("utf8"),
    );
    if (typeof time !== "string" || typeof id !== "string" || !id)
      throw invalid();
    const after = { createdAt: new Date(time), _id: id };
    if (encodeCursor(after) !== cursor) throw invalid();
    return { limit: size, after };
  } catch {
    throw invalid();
  }
}

export function cursorFilter(after?: Cursor) {
  return after
    ? {
        $or: [
          { createdAt: { $gt: after.createdAt } },
          { createdAt: after.createdAt, _id: { $gt: after._id } },
        ],
      }
    : {};
}

export function splitPage<T extends Cursor>(rows: T[], limit: number) {
  const items = rows.slice(0, limit);
  return {
    items,
    nextCursor: rows.length > limit ? encodeCursor(items[limit - 1]!) : null,
  };
}
