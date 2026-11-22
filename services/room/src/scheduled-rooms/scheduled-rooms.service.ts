import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { randomUUID } from "node:crypto";
import {
  type ScheduledRoom,
  type ScheduledRoomVisibility,
  ScheduledRoomsRepository,
} from "./scheduled-rooms.repository";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

@Injectable()
export class ScheduledRoomsService {
  constructor(private readonly schedules: ScheduledRoomsRepository) {}

  async create(
    input: {
      movieId?: unknown;
      visibility?: unknown;
      scheduledFor?: unknown;
      inviteeIds?: unknown;
    },
    ownerId?: string,
  ): Promise<ScheduledRoom> {
    const owner = this.requireUser(ownerId);
    if (
      typeof input.movieId !== "string" ||
      !input.movieId.trim() ||
      input.movieId.length > 128
    ) {
      throw new BadRequestException("movieId must be a non-empty string");
    }
    if (input.visibility !== "PRIVATE" && input.visibility !== "PUBLIC") {
      throw new BadRequestException("visibility must be PRIVATE or PUBLIC");
    }
    const scheduledFor = this.parseFutureDate(input.scheduledFor);
    if (
      !Array.isArray(input.inviteeIds) ||
      input.inviteeIds.some(
        (id) => typeof id !== "string" || !uuidPattern.test(id),
      )
    ) {
      throw new BadRequestException("inviteeIds must be an array of UUIDs");
    }
    const inviteeIds = [...new Set(input.inviteeIds as string[])];
    if (inviteeIds.length > 19) {
      throw new BadRequestException(
        "A scheduled room supports at most 19 invitees",
      );
    }
    if (input.inviteeIds.includes(owner)) {
      throw new BadRequestException("The owner cannot be listed as an invitee");
    }
    return this.schedules.create({
      scheduledRoomId: randomUUID(),
      roomId: randomUUID(),
      ownerId: owner,
      movieId: input.movieId.trim(),
      visibility: input.visibility as ScheduledRoomVisibility,
      scheduledFor,
      inviteeIds,
    });
  }

  async list(ownerId?: string) {
    return this.schedules.listByOwner(this.requireUser(ownerId));
  }

  async cancel(id: string, ownerId?: string): Promise<ScheduledRoom> {
    const owner = this.requireUser(ownerId);
    if (!uuidPattern.test(id))
      throw new BadRequestException("schedule id must be a UUID");
    const schedule = await this.schedules.findById(id);
    if (!schedule) throw new NotFoundException("Scheduled room not found");
    if (schedule.ownerId !== owner)
      throw new ForbiddenException(
        "Only the owner can cancel a scheduled room",
      );
    if (schedule.status !== "SCHEDULED")
      throw new ConflictException("Only a pending schedule can be cancelled");
    const cancelled = await this.schedules.cancel(id);
    if (!cancelled)
      throw new ConflictException("Schedule is no longer cancellable");
    return cancelled;
  }

  private requireUser(ownerId?: string): string {
    if (!ownerId || !uuidPattern.test(ownerId)) {
      throw new ForbiddenException(
        "Authenticated user with a valid UUID is required",
      );
    }
    return ownerId;
  }

  private parseFutureDate(value: unknown): Date {
    if (typeof value !== "string" || !/^\d{4}-\d\d-\d\dT/.test(value)) {
      throw new BadRequestException("scheduledFor must be an ISO timestamp");
    }
    const date = new Date(value);
    if (!Number.isFinite(date.getTime()))
      throw new BadRequestException("scheduledFor is invalid");
    if (date.getTime() <= Date.now())
      throw new BadRequestException("scheduledFor must be in the future");
    return date;
  }
}
