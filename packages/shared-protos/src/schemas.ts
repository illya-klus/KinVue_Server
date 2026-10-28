import { z } from "zod";

// Bodies and event envelopes from implementation-plan phases 8, 9, 14, 16, 18,
// 19, 21, 22 and 25. Transport and endpoint implementations are separate work.
const userId = z.uuid();
const entityId = z.string().min(1);
const timestamp = z.iso.datetime({ offset: true });
export const usernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9_]{3,30}$/);
export const displayNameSchema = z.string().trim().min(1).max(100);
export const passwordSchema = z
  .string()
  .min(12)
  .refine(
    (value) => new TextEncoder().encode(value).length <= 1024,
    "Password exceeds 1024 UTF-8 bytes",
  );
const email = z.email();

export const registerRequestSchema = z.strictObject({
  email,
  password: passwordSchema,
  username: usernameSchema,
  displayName: displayNameSchema,
});
// Existing passwords must not be transformed or subjected to new registration rules.
export const loginRequestSchema = z.strictObject({
  email,
  password: z.string().min(1),
});
export const createProfileRequestSchema = z.strictObject({
  userId,
  username: usernameSchema,
  displayName: displayNameSchema,
});
export const updateProfileRequestSchema = z.strictObject({
  displayName: displayNameSchema.optional(),
  avatarUrl: z.url().nullable().optional(),
  preferences: z
    .strictObject({
      genres: z.array(z.string()).optional(),
      languages: z.array(z.string()).optional(),
      autoplay: z.boolean().optional(),
    })
    .optional(),
});
export const friendRequestSchema = z.strictObject({ targetUserId: userId });
export const createMovieRequestSchema = z.strictObject({
  title: z.string().trim().min(1),
  description: z.string(),
  genres: z.array(z.string()),
  durationSeconds: z.number().int().positive(),
  posterKey: z.string().min(1),
});
export const scheduleMovieRequestSchema = z.strictObject({
  publishAt: timestamp,
});
export const visibilitySchema = z.enum(["PRIVATE", "PUBLIC"]);
export const createRoomRequestSchema = z.strictObject({
  visibility: visibilitySchema,
  movieId: entityId,
});
export const scheduleRoomRequestSchema = z.strictObject({
  movieId: entityId,
  visibility: visibilitySchema,
  scheduledFor: timestamp,
  inviteeIds: z.array(userId),
});
export const roomRoleSchema = z.enum(["OWNER", "CONTROLLER", "VIEWER"]);
export const inviteRequestSchema = z.strictObject({
  targetUserId: userId,
  role: z.literal("VIEWER").default("VIEWER"),
});
export const uploadInitRequestSchema = z.strictObject({
  fileName: z.string().min(1),
  contentType: z.enum(["video/mp4", "video/quicktime", "video/x-matroska"]),
  fileSizeBytes: z
    .number()
    .int()
    .gt(1024 * 1024)
    .max(25 * 1024 ** 3),
  partCount: z.number().int().positive().max(10_000),
});

export const notificationEventNames = [
  "FRIEND_REQUEST_CREATED",
  "FRIEND_REQUEST_ACCEPTED",
  "ROOM_INVITED",
] as const;
const eventEnvelope = {
  eventId: z.uuid(),
  occurredAt: timestamp,
  recipientId: userId,
};
export const notificationEventSchema = z.discriminatedUnion("type", [
  z.strictObject({
    ...eventEnvelope,
    type: z.literal("FRIEND_REQUEST_CREATED"),
    producer: z.literal("users"),
    payload: z.strictObject({ friendshipId: entityId, fromUserId: userId }),
  }),
  z.strictObject({
    ...eventEnvelope,
    type: z.literal("FRIEND_REQUEST_ACCEPTED"),
    producer: z.literal("users"),
    payload: z.strictObject({ friendshipId: entityId, fromUserId: userId }),
  }),
  z.strictObject({
    ...eventEnvelope,
    type: z.literal("ROOM_INVITED"),
    producer: z.literal("rooms"),
    payload: z.strictObject({ roomId: entityId, fromUserId: userId }),
  }),
]);
export const playbackClientEventNames = [
  "room.play",
  "room.pause",
  "room.seek",
] as const;
export const playbackServerEventNames = [
  "room.playback_state_changed",
] as const;
export const chatEventNames = [
  "chat.message",
  "chat.message_created",
  "chat.reaction",
  "chat.reaction_created",
] as const;
export const playbackCommandSchema = z.strictObject({
  type: z.enum(playbackClientEventNames),
  eventId: entityId,
  roomId: entityId,
  positionSeconds: z.number().nonnegative(),
  clientSentAt: timestamp,
});
export const playbackStateChangedSchema = z.strictObject({
  type: z.literal("room.playback_state_changed"),
  roomId: entityId,
  playbackStatus: z.enum(["PLAYING", "PAUSED"]),
  positionSeconds: z.number().nonnegative(),
  updatedAt: timestamp,
  version: z.number().int().nonnegative(),
});
export const chatMessageSchema = z.strictObject({
  messageId: entityId,
  roomId: entityId,
  text: z.string().trim().min(1).max(1000),
});
export const chatReactionSchema = z.strictObject({
  reactionId: entityId,
  roomId: entityId,
  emoji: z.enum(["like", "laugh", "wow", "sad", "fire"]),
});

export type RegisterRequest = z.infer<typeof registerRequestSchema>;
export type LoginRequest = z.infer<typeof loginRequestSchema>;
export type CreateProfileRequest = z.infer<typeof createProfileRequestSchema>;
export type UpdateProfileRequest = z.infer<typeof updateProfileRequestSchema>;
export type FriendRequest = z.infer<typeof friendRequestSchema>;
export type CreateMovieRequest = z.infer<typeof createMovieRequestSchema>;
export type ScheduleMovieRequest = z.infer<typeof scheduleMovieRequestSchema>;
export type ScheduleRoomRequest = z.infer<typeof scheduleRoomRequestSchema>;
export type CreateRoomRequest = z.infer<typeof createRoomRequestSchema>;
export type InviteRequest = z.infer<typeof inviteRequestSchema>;
export type UploadInitRequest = z.infer<typeof uploadInitRequestSchema>;
export type NotificationEvent = z.infer<typeof notificationEventSchema>;
export type PlaybackCommand = z.infer<typeof playbackCommandSchema>;
export type PlaybackStateChanged = z.infer<typeof playbackStateChangedSchema>;
export type ChatMessage = z.infer<typeof chatMessageSchema>;
export type ChatReaction = z.infer<typeof chatReactionSchema>;
