import { Injectable } from "@nestjs/common";
import { AppError } from "@kinvue/errors";
import {
  type UpdateProfileRequest,
  createProfileRequestSchema,
  updateProfileRequestSchema,
} from "@kinvue/contracts";
import { UsernameTakenError, UsersRepository } from "./users.repository";
import { type PageQuery, pageOptions, splitPage } from "../mongo/pagination";
import {
  type UserProfile,
  type UserSearchResponse,
  toUserProfile,
} from "./users.types";
import {
  usersProfileReads,
  usersSearchLatency,
} from "../users-observability.metrics";

const MAX_QUERY_LENGTH = 50;

function validationFailed(message = "Validation failed"): AppError {
  return new AppError("VALIDATION_FAILED", message);
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
    const parsed = updateProfileRequestSchema.safeParse(body);
    if (!parsed.success) throw validationFailed();
    const patch: UpdateProfileRequest = parsed.data;
    const doc = await this.repo.update(userId, patch);
    if (!doc) throw new AppError("NOT_FOUND", "Profile not found");
    return toUserProfile(doc);
  }

  /** Internal bootstrap used by auth/dev tooling; idempotent per userId. */
  async createProfile(
    body: unknown,
  ): Promise<{ profile: UserProfile; created: boolean }> {
    const parsed = createProfileRequestSchema.safeParse(body);
    if (!parsed.success) throw validationFailed();
    try {
      const { doc, created } = await this.repo.create({
        ...parsed.data,
        userId: parsed.data.userId.toLowerCase(),
      });
      return { profile: toUserProfile(doc), created };
    } catch (error) {
      if (error instanceof UsernameTakenError) {
        throw new AppError("CONFLICT", "Username is already taken");
      }
      throw error;
    }
  }

  async search(
    callerId: string,
    params: PageQuery & { query?: string },
  ): Promise<UserSearchResponse> {
    const stop = usersSearchLatency.startTimer();
    try {
      const query = typeof params.query === "string" ? params.query.trim() : "";
      if (query.length < 2 || query.length > MAX_QUERY_LENGTH) {
        throw validationFailed();
      }
      const { limit, after } = pageOptions(params);
      const rows = await this.repo.search({
        query,
        excludeUserId: callerId,
        limit: limit + 1,
        after,
      });
      const page = splitPage(rows, limit);
      const response: UserSearchResponse = {
        items: page.items.map((doc) => ({
          userId: doc._id,
          username: doc.username,
          displayName: doc.displayName,
        })),
        nextCursor: page.nextCursor,
      };
      stop({ outcome: "success" });
      return response;
    } catch (error) {
      stop({ outcome: "error" });
      throw error;
    }
  }
}
