const { test } = require("node:test");
const assert = require("node:assert/strict");
const { randomUUID } = require("node:crypto");
const s = require("../dist/schemas.js");

test("registration normalizes names, preserves password and rejects invalid boundaries", () => {
  const body = {
    email: "test@example.test",
    username: " MOVIE_FAN ",
    displayName: " Fan ",
    password: "  Secret password  ",
  };
  const parsed = s.registerRequestSchema.parse(body);
  assert.equal(parsed.username, "movie_fan");
  assert.equal(parsed.displayName, "Fan");
  assert.equal(parsed.password, body.password);
  for (const patch of [
    { username: "ab" },
    { username: "юзер" },
    { username: "a".repeat(31) },
    { displayName: " " },
    { displayName: "a".repeat(101) },
    { password: "a".repeat(11) },
    { password: "я".repeat(513) },
    { role: "ADMIN" },
  ]) {
    assert.equal(
      s.registerRequestSchema.safeParse({ ...body, ...patch }).success,
      false,
    );
  }
  assert.equal(s.passwordSchema.safeParse("я".repeat(512)).success, true);
  assert.equal(
    s.loginRequestSchema.parse({ email: body.email, password: " old " })
      .password,
    " old ",
  );
});

test("documented request bodies validate without implementing endpoints", () => {
  const userId = randomUUID();
  s.createProfileRequestSchema.parse({
    userId,
    username: "test_user",
    displayName: "Test",
  });
  s.updateProfileRequestSchema.parse({
    displayName: "New",
    avatarUrl: "https://example.test/avatar.png",
    preferences: { genres: ["drama"], languages: ["uk"], autoplay: true },
  });
  s.friendRequestSchema.parse({ targetUserId: userId });
  s.createMovieRequestSchema.parse({
    title: "Interstellar",
    description: "Space",
    genres: ["sci-fi"],
    durationSeconds: 10140,
    posterKey: "posters/movie.jpg",
  });
  s.scheduleMovieRequestSchema.parse({ publishAt: "2026-11-01T12:00:00Z" });
  s.scheduleRoomRequestSchema.parse({
    movieId: "movie_123",
    visibility: "PRIVATE",
    scheduledFor: "2026-11-01T12:00:00Z",
    inviteeIds: [userId],
  });
  s.createRoomRequestSchema.parse({
    movieId: "movie_123",
    visibility: "PUBLIC",
  });
  assert.equal(
    s.inviteRequestSchema.parse({ targetUserId: userId }).role,
    "VIEWER",
  );
  assert.equal(
    s.inviteRequestSchema.safeParse({ targetUserId: userId, role: "OWNER" })
      .success,
    false,
  );
});

test("upload rejects unsupported media, invalid part counts and byte bounds", () => {
  const body = {
    fileName: "movie.mp4",
    contentType: "video/mp4",
    fileSizeBytes: 25 * 1024 ** 3,
    partCount: 200,
  };
  s.uploadInitRequestSchema.parse(body);
  for (const patch of [
    { contentType: "text/plain" },
    { fileSizeBytes: 1024 ** 2 },
    { fileSizeBytes: 25 * 1024 ** 3 + 1 },
    { partCount: 0 },
    { partCount: 1.5 },
  ])
    assert.equal(
      s.uploadInitRequestSchema.safeParse({ ...body, ...patch }).success,
      false,
    );
});

test("notification union rejects missing routing data and mismatched producers", () => {
  const base = {
    eventId: randomUUID(),
    recipientId: randomUUID(),
    occurredAt: "2026-10-28T12:00:00Z",
  };
  for (const type of s.notificationEventNames) {
    const body = {
      ...base,
      type,
      producer: type === "ROOM_INVITED" ? "rooms" : "users",
      payload: {
        fromUserId: randomUUID(),
        ...(type === "ROOM_INVITED"
          ? { roomId: "room_123" }
          : { friendshipId: "friend_123" }),
      },
    };
    s.notificationEventSchema.parse(body);
    assert.equal(
      s.notificationEventSchema.safeParse({ ...body, producer: "chat" })
        .success,
      false,
    );
    assert.equal(
      s.notificationEventSchema.safeParse({ ...body, recipientId: undefined })
        .success,
      false,
    );
  }
});

test("playback and chat events match phases 18/19 and enforce payload boundaries", () => {
  assert.deepEqual(s.playbackClientEventNames, [
    "room.play",
    "room.pause",
    "room.seek",
  ]);
  assert.deepEqual(s.playbackServerEventNames, ["room.playback_state_changed"]);
  assert.deepEqual(s.chatEventNames, [
    "chat.message",
    "chat.message_created",
    "chat.reaction",
    "chat.reaction_created",
  ]);
  s.playbackCommandSchema.parse({
    type: "room.seek",
    eventId: "evt_123",
    roomId: "room_123",
    positionSeconds: 42,
    clientSentAt: "2026-10-28T12:00:00Z",
  });
  s.playbackStateChangedSchema.parse({
    type: "room.playback_state_changed",
    roomId: "room_123",
    positionSeconds: 42,
    playbackStatus: "PAUSED",
    updatedAt: "2026-10-28T12:00:00Z",
    version: 1,
  });
  for (const text of [" ", "a".repeat(1001)])
    assert.equal(
      s.chatMessageSchema.safeParse({
        messageId: "msg_123",
        roomId: "room_123",
        text,
      }).success,
      false,
    );
  assert.equal(
    s.chatReactionSchema.safeParse({
      reactionId: "react_123",
      roomId: "room_123",
      emoji: "unknown",
    }).success,
    false,
  );
});
