import { BadRequestException, ForbiddenException } from "@nestjs/common";
import { ScheduledRoomsService } from "./scheduled-rooms.service";
import type { ScheduledRoomsRepository } from "./scheduled-rooms.repository";

const owner = "11111111-1111-4111-8111-111111111111";
const invitee = "22222222-2222-4222-8222-222222222222";
const scheduleId = "33333333-3333-4333-8333-333333333333";
const schedule = {
  scheduledRoomId: scheduleId,
  roomId: "44444444-4444-4444-8444-444444444444",
  ownerId: owner,
  movieId: "movie-1",
  visibility: "PRIVATE" as const,
  scheduledFor: new Date(Date.now() + 60_000),
  status: "SCHEDULED" as const,
  createdAt: new Date(),
  updatedAt: new Date(),
  inviteeIds: [invitee],
};

describe("ScheduledRoomsService", () => {
  const repository = {
    create: jest.fn(),
    listByOwner: jest.fn(),
    findById: jest.fn(),
    cancel: jest.fn(),
  };
  let service: ScheduledRoomsService;

  beforeEach(() => {
    jest.resetAllMocks();
    service = new ScheduledRoomsService(
      repository as unknown as ScheduledRoomsRepository,
    );
  });

  it("creates a future schedule and stores distinct invitees", async () => {
    repository.create.mockImplementation(async (input) => ({
      ...schedule,
      ...input,
    }));
    const result = await service.create(
      {
        movieId: " movie-1 ",
        visibility: "PRIVATE",
        scheduledFor: new Date(Date.now() + 60_000).toISOString(),
        inviteeIds: [invitee, invitee],
      },
      owner,
    );
    expect(result.inviteeIds).toEqual([invitee]);
    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        ownerId: owner,
        movieId: "movie-1",
        inviteeIds: [invitee],
      }),
    );
  });

  it("rejects past schedules and owners attempting to cancel another user's schedule", async () => {
    await expect(
      service.create(
        {
          movieId: "m",
          visibility: "PUBLIC",
          scheduledFor: new Date(Date.now() - 1000).toISOString(),
          inviteeIds: [],
        },
        owner,
      ),
    ).rejects.toThrow(BadRequestException);
    repository.findById.mockResolvedValue(schedule);
    await expect(service.cancel(scheduleId, invitee)).rejects.toThrow(
      ForbiddenException,
    );
    expect(repository.cancel).not.toHaveBeenCalled();
  });

  it("rejects schedules with more invitees than the room capacity", async () => {
    const inviteeIds = Array.from(
      { length: 20 },
      (_, index) =>
        `33333333-3333-4333-8333-${String(index).padStart(12, "0")}`,
    );
    await expect(
      service.create(
        {
          movieId: "movie-1",
          visibility: "PRIVATE",
          scheduledFor: new Date(Date.now() + 60_000).toISOString(),
          inviteeIds,
        },
        owner,
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it("allows only the owner to cancel and returns the cancelled schedule", async () => {
    const cancelled = { ...schedule, status: "CANCELLED" as const };
    repository.findById.mockResolvedValue(schedule);
    repository.cancel.mockResolvedValue(cancelled);

    await expect(service.cancel(scheduleId, owner)).resolves.toEqual(cancelled);
    expect(repository.cancel).toHaveBeenCalledWith(scheduleId);
  });
});
