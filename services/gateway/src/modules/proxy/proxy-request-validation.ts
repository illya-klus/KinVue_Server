import {
  acceptRoomInviteRequestSchema,
  changeRoomRoleRequestSchema,
  createRoomRequestSchema,
  friendRequestSchema,
  inviteRequestSchema,
  loginRequestSchema,
  registerRequestSchema,
  scheduleRoomRequestSchema,
  updateProfileRequestSchema,
  uploadCompleteRequestSchema,
  uploadInitRequestSchema,
} from "@kinvue/contracts";

const bodyValidators = [
  {
    method: "POST",
    path: /^\/api\/auth\/register\/?$/,
    schema: registerRequestSchema,
  },
  {
    method: "POST",
    path: /^\/api\/auth\/login\/?$/,
    schema: loginRequestSchema,
  },
  {
    method: "PATCH",
    path: /^\/api\/users\/me\/?$/,
    schema: updateProfileRequestSchema,
  },
  {
    method: "POST",
    path: /^\/api\/friend-requests\/?$/,
    schema: friendRequestSchema,
  },
  {
    method: "POST",
    path: /^\/api\/rooms\/?$/,
    schema: createRoomRequestSchema,
  },
  {
    method: "POST",
    path: /^\/api\/scheduled-rooms\/?$/,
    schema: scheduleRoomRequestSchema,
  },
  {
    method: "POST",
    path: /^\/api\/rooms\/[^/]+\/invites\/?$/,
    schema: inviteRequestSchema,
  },
  {
    method: "POST",
    path: /^\/api\/rooms\/[^/]+\/invites\/accept\/?$/,
    schema: acceptRoomInviteRequestSchema,
  },
  {
    method: "POST",
    path: /^\/api\/rooms\/[^/]+\/permissions\/?$/,
    schema: changeRoomRoleRequestSchema,
  },
  {
    method: "POST",
    path: /^\/api\/admin\/movies\/[^/]+\/upload\/init\/?$/,
    schema: uploadInitRequestSchema,
  },
  {
    method: "POST",
    path: /^\/api\/admin\/movies\/[^/]+\/upload\/complete\/?$/,
    schema: uploadCompleteRequestSchema,
  },
];

export function validateProxyRequestBody(
  method: string,
  path: string,
  body: unknown,
): { data: unknown } | { error: string } | undefined {
  const normalizedPath = path.split("?")[0] ?? path;
  const route = bodyValidators.find(
    (candidate) =>
      candidate.method === method.toUpperCase() &&
      candidate.path.test(normalizedPath),
  );
  if (!route) return undefined;

  const result = route.schema.safeParse(body);
  if (result.success) return { data: result.data };
  return {
    error: result.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("; "),
  };
}
