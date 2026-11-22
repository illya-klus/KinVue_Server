import {
  BadRequestException,
  ForbiddenException,
  type INestApplication,
} from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import type { App } from "supertest/types";
import { AppController } from "./app.controller";
import { RoomsService } from "./rooms.service";
import { ScheduledRoomsService } from "./scheduled-rooms/scheduled-rooms.service";

describe("Rooms HTTP authorization", () => {
  let app: INestApplication<App>;
  const rooms = {
    createRoom: jest.fn(),
    listPublicRooms: jest.fn(),
    getRoomMembers: jest.fn(),
    closeRoom: jest.fn(),
    createDirectInvite: jest.fn(),
    createInviteLink: jest.fn(),
    acceptInvite: jest.fn(),
    changeMemberRole: jest.fn(),
  };
  const scheduledRooms = {
    create: jest.fn(),
    list: jest.fn(),
    cancel: jest.fn(),
  };

  beforeEach(async () => {
    jest.resetAllMocks();
    const module = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        { provide: RoomsService, useValue: rooms },
        { provide: ScheduledRoomsService, useValue: scheduledRooms },
      ],
    }).compile();
    app = module.createNestApplication();
    app.setGlobalPrefix("api");
    await app.init();
  });

  afterEach(async () => app.close());

  it.each(["PRIVATE", "PUBLIC"])(
    "creates a %s room for the authenticated owner",
    async (visibility) => {
      const created = {
        id: "room-1",
        movieId: "movie-1",
        visibility,
      };
      rooms.createRoom.mockResolvedValue(created);

      await request(app.getHttpServer())
        .post("/api/rooms")
        .set("x-user-id", "owner-1")
        .send({ movieId: "movie-1", visibility })
        .expect(201, created);

      expect(rooms.createRoom).toHaveBeenCalledWith(
        "movie-1",
        visibility,
        "owner-1",
      );
    },
  );

  it("returns 403 when a non-owner tries to invite a user", async () => {
    rooms.createDirectInvite.mockRejectedValue(
      new ForbiddenException("Only the owner can invite users"),
    );

    await request(app.getHttpServer())
      .post("/api/rooms/room-1/invites")
      .set("x-user-id", "member-1")
      .send({ targetUserId: "member-2" })
      .expect(403);

    expect(rooms.createDirectInvite).toHaveBeenCalledWith(
      "room-1",
      "member-2",
      "member-1",
    );
  });

  it("returns 403 when a non-owner tries to close a room", async () => {
    rooms.closeRoom.mockRejectedValue(
      new ForbiddenException("Only the owner can close a room"),
    );

    await request(app.getHttpServer())
      .delete("/api/rooms/room-1")
      .set("x-user-id", "member-1")
      .expect(403);

    expect(rooms.closeRoom).toHaveBeenCalledWith("room-1", "member-1");
  });

  it("returns room membership and current role to a member", async () => {
    const result = {
      roomId: "room-1",
      ownerId: "owner-1",
      currentUserRole: "VIEWER",
      members: [{ userId: "member-1", role: "VIEWER", presence: "ONLINE" }],
    };
    rooms.getRoomMembers.mockResolvedValue(result);
    await request(app.getHttpServer())
      .get("/api/rooms/room-1/members")
      .set("x-user-id", "member-1")
      .expect(200, result);
    expect(rooms.getRoomMembers).toHaveBeenCalledWith("room-1", "member-1");
  });

  it("routes owner permission changes and rejects OWNER as a target role", async () => {
    rooms.changeMemberRole.mockResolvedValue({
      roomId: "room-1",
      userId: "member-2",
      role: "CONTROLLER",
    });

    await request(app.getHttpServer())
      .post("/api/rooms/room-1/permissions")
      .set("x-user-id", "owner-1")
      .send({ userId: "member-2", role: "CONTROLLER" })
      .expect(201, {
        roomId: "room-1",
        userId: "member-2",
        role: "CONTROLLER",
      });

    expect(rooms.changeMemberRole).toHaveBeenCalledWith(
      "room-1",
      "member-2",
      "CONTROLLER",
      "owner-1",
    );

    rooms.changeMemberRole.mockRejectedValueOnce(
      new BadRequestException("Role must be VIEWER or CONTROLLER"),
    );
    await request(app.getHttpServer())
      .post("/api/rooms/room-1/permissions")
      .set("x-user-id", "owner-1")
      .send({ userId: "owner-1", role: "OWNER" })
      .expect(400);
  });
});
