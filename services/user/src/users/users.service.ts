import { Injectable } from "@nestjs/common";
import { AppError } from "@kinvue/errors";
import {
  type UpdateProfileRequest,
  createProfileRequestSchema,
  updateProfileRequestSchema,
} from "@kinvue/contracts";
import { UsernameTakenError, UsersRepository } from "./users.repository";
import {
  type UserProfile,
  type UserSearchResponse,
  toUserProfile,
} from "./users.types";
import {
  usersProfileReads,
  usersSearchLatency,
} from "../users-observability.metrics";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;
const MAX_QUERY_LENGTH = 50;

function validationFailed(message = "Validation failed"): AppError {
  return new AppError("VALIDATION_FAILED", message);
}

export function encodeCursor(username: string): string {
  return Buffer.from(username, "utf8").toString("base64url");
}

export function decodeCursor(cursor: string): string {
  const value = Buffer.from(cursor, "base64url").toString("utf8");
  if (!value || encodeCursor(value) !== cursor) throw validationFailed();
  return value;
}

@Injectable()
export class UsersService {
  constructor(private readonly repo: UsersRepository) {}

  async getMe(userId: string): Promise<UserProfile> {
    const doc = await this.repo.findById(userId);
    usersProfileReads.inc({ outcome: doc ? "found" : "not_found" });
    if (!doc) throw new AppError("NOT_FOUND", "Profile not found");
    return toUserProfile(doc);
  }

  async updateMe(userId: string, body: unknown): Promise<UserProfile> {
    const parsed = updateProfileRequestSchema.safeParse(body ?? {});
    if (!parsed.success) throw validationFailed();
    const patch: UpdateProfileRequest = parsed.data;
    const doc = await this.repo.update(userId, patch);
    if (!doc) throw new AppError("NOT_FOUND", "Profile not found");
    return toUserProfile(doc);
  }

  /** Internal bootstrap used by auth/dev tooling; idempotent per userId. */
  async createProfile(body: unknown): Promise<UserProfile> {
    const parsed = createProfileRequestSchema.safeParse(body);
    if (!parsed.success) throw validationFailed();
    try {
      const { doc } = await this.repo.create(parsed.data);
      return toUserProfile(doc);
    } catch (error) {
      if (error instanceof UsernameTakenError) {
        throw new AppError("CONFLICT", "Username is already taken");
      }
      throw error;
    }
  }

  async search(
    callerId: string,
    params: { query?: string; limit?: string; cursor?: string },
  ): Promise<UserSearchResponse> {
    const stop = usersSearchLatency.startTimer();
    try {
      const query = typeof params.query === "string" ? params.query.trim() : "";
      if (query.length === 0 || query.length > MAX_QUERY_LENGTH) {
        throw validationFailed();
      }
      let limit = DEFAULT_LIMIT;
      if (params.limit !== undefined) {
        limit = typeof params.limit === "string" ? Number(params.limit) : NaN;
        if (!Number.isInteger(limit) || limit < 1 || limit > MAX_LIMIT) {
          throw validationFailed();
        }
      }
      const afterUsername =
        params.cursor === undefined
          ? undefined
          : typeof params.cursor === "string"
            ? decodeCursor(params.cursor)
            : (() => {
                throw validationFailed();
              })();
      const rows = await this.repo.search({
        query,
        excludeUserId: callerId,
        limit: limit + 1,
        afterUsername,
      });
      const page = rows.slice(0, limit);
      const last = page[page.length - 1];
      const response: UserSearchResponse = {
        items: page.map((doc) => ({
          userId: doc._id,
          username: doc.username,
          displayName: doc.displayName,
        })),
        nextCursor:
          rows.length > limit && last ? encodeCursor(last.username) : null,
      };
      stop({ outcome: "success" });
      return response;
    } catch (error) {
      stop({ outcome: "error" });
      throw error;
    }
  }
}
