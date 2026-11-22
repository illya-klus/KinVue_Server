import { Inject, Injectable } from "@nestjs/common";
import { ROOMS_REDIS, type RoomsRedisClient } from "../health.controller";
import { RoomInvitesRepository } from "../invites/room-invites.repository";

export type Presence = "ONLINE" | "DISCONNECTED" | "LEFT";
export type Role = "OWNER" | "CONTROLLER" | "VIEWER";
export type RoomEvent = {
  type: string;
  roomId: string;
  [key: string]: unknown;
};
const common = `
local function result(value) return cjson.encode(value) end
local function reject(code) return result({error=code}) end
local now=tonumber(ARGV[2])
if redis.call('EXISTS',KEYS[1])==0 then return reject('ROOM_NOT_FOUND') end
if redis.call('HGET',KEYS[1],'status')~='ACTIVE' then return reject('ROOM_CLOSED') end
local raw=redis.call('HGET',KEYS[2],ARGV[1])
local member=raw and cjson.decode(raw) or nil
local function publish(event) redis.call('PUBLISH',KEYS[1]..':events',result(event)) end
local function touch()
 for _,key in ipairs(KEYS) do redis.call('EXPIRE',key,21600) end
end
`;
const join =
  common +
  `
local active=member and member.presence~='LEFT'
local owner=redis.call('HGET',KEYS[1],'ownerId')==ARGV[1]
if redis.call('HGET',KEYS[1],'visibility')=='PRIVATE' and not owner and not active and ARGV[3]~='1' then return reject('INVITE_REQUIRED') end
if not active then
 local count=0
 for _,value in ipairs(redis.call('HVALS',KEYS[2])) do
  if cjson.decode(value).presence~='LEFT' then count=count+1 end
 end
 if count>=20 then return reject('ROOM_FULL') end
 member={userId=ARGV[1],role=owner and 'OWNER' or 'VIEWER',joinedAt=ARGV[4]}
end
member.presence='ONLINE'; member.lastHeartbeatAt=now
redis.call('HSET',KEYS[2],ARGV[1],result(member))
touch()
publish({type='room.presence_changed',roomId=redis.call('HGET',KEYS[1],'id'),userId=ARGV[1],presence='ONLINE',role=member.role})
local state=redis.call('HGETALL',KEYS[1]); local data={}
for i=1,#state,2 do data[state[i]]=state[i+1] end
return result({state=data,member=member})
`;
const command =
  common +
  `
if not member or member.presence=='LEFT' then return reject('MEMBERSHIP_REQUIRED') end
local action=ARGV[3]; local roomId=redis.call('HGET',KEYS[1],'id')
if action=='room.heartbeat' or action=='room.leave' then
 member.presence=action=='room.leave' and 'LEFT' or 'ONLINE';member.lastHeartbeatAt=now
 redis.call('HSET',KEYS[2],ARGV[1],result(member))
 touch()
 publish({type='room.presence_changed',roomId=roomId,userId=ARGV[1],presence=member.presence,role=member.role})
 return result({ok=true})
end
if action=='room.play' or action=='room.pause' or action=='room.seek' then
 if member.role~='OWNER' and member.role~='CONTROLLER' then return reject('CONTROL_FORBIDDEN') end
 local position=tonumber(redis.call('HGET',KEYS[1],'positionSeconds') or '0')
 local status=redis.call('HGET',KEYS[1],'playbackStatus') or 'PAUSED'
 local updated=tonumber(redis.call('HGET',KEYS[1],'updatedAtMs') or tostring(now))
 if status=='PLAYING' then position=position+math.max(0,now-updated)/1000 end
 if action=='room.seek' then position=tonumber(ARGV[4]) end
 if action=='room.play' then status='PLAYING' elseif action=='room.pause' then status='PAUSED' end
 local version=redis.call('HINCRBY',KEYS[1],'version',1)
 redis.call('HSET',KEYS[1],'playbackStatus',status,'positionSeconds',tostring(position),'updatedAt',ARGV[5],'updatedAtMs',ARGV[2])
 touch()
 local event={type='room.playback_state_changed',roomId=roomId,playbackStatus=status,positionSeconds=position,updatedAt=ARGV[5],version=version}
 publish(event);return result(event)
end
local payload=cjson.decode(ARGV[4])
if action=='chat.message' then
 local identity=ARGV[1]..':'..payload.messageId
 redis.call('ZREMRANGEBYSCORE',KEYS[4],'-inf',now-86400000)
 if redis.call('ZSCORE',KEYS[4],identity) then return result({duplicate=true}) end
 redis.call('ZADD',KEYS[4],now,identity)
 payload.type='chat.message_created';payload.userId=ARGV[1];payload.createdAt=ARGV[5];payload.createdAtMs=now;payload.roomId=roomId
 redis.call('RPUSH',KEYS[3],result(payload))
 while redis.call('LLEN',KEYS[3])>0 do
  local oldest=cjson.decode(redis.call('LINDEX',KEYS[3],0))
  if oldest.createdAtMs>now-86400000 then break end
  redis.call('LPOP',KEYS[3])
 end
elseif action=='chat.reaction' then
 payload.type='chat.reaction_created';payload.userId=ARGV[1];payload.createdAt=ARGV[5];payload.roomId=roomId
else return reject('INVALID_EVENT') end
touch();publish(payload);return result({ok=true})
`;
const sweep = `
if redis.call('EXISTS',KEYS[1])==0 then redis.call('DEL',KEYS[2],KEYS[3],KEYS[4]);return 0 end
if redis.call('HGET',KEYS[1],'status')~='ACTIVE' then return 0 end
local rows=redis.call('HGETALL',KEYS[2]);local count=0
for i=1,#rows,2 do
 local member=cjson.decode(rows[i+1])
 if member.presence=='ONLINE' and tonumber(ARGV[1])-(member.lastHeartbeatAt or 0)>75000 then
  member.presence='DISCONNECTED'
  redis.call('HSET',KEYS[2],rows[i],cjson.encode(member))
  redis.call('PUBLISH',KEYS[1]..':events',cjson.encode({type='room.presence_changed',roomId=ARGV[2],userId=rows[i],presence='DISCONNECTED',role=member.role}))
  count=count+1
 end
end
return count
`;
@Injectable()
export class RoomRealtimeStore {
  constructor(
    @Inject(ROOMS_REDIS) private readonly redis: RoomsRedisClient,
    private readonly invites: RoomInvitesRepository,
  ) {}
  keys(id: string) {
    return [
      `room:${id}`,
      `room:${id}:members`,
      `room:${id}:messages`,
      `room:${id}:message-ids`,
    ];
  }
  async join(roomId: string, userId: string, now = Date.now()) {
    const existing = await this.redis.hget(this.keys(roomId)[1], userId);
    const state = await this.redis.hgetall(this.keys(roomId)[0]);
    let invite: Awaited<ReturnType<RoomInvitesRepository["findDirectInvite"]>> =
      null;
    if (
      state.visibility === "PRIVATE" &&
      state.ownerId !== userId &&
      (!existing || JSON.parse(existing).presence === "LEFT")
    )
      invite = await this.invites.findDirectInvite(roomId, userId);
    const response = this.decode(
      await this.redis.eval(
        join,
        4,
        ...this.keys(roomId),
        userId,
        String(now),
        invite ? "1" : "0",
        new Date(now).toISOString(),
      ),
    );
    if (invite) await this.invites.markAccepted(invite.id);
    const value = response as {
      state: Record<string, string>;
      member: { role: Role };
    };
    return {
      type: "room.state_sync",
      roomId,
      movieId: value.state.movieId,
      role: value.member.role,
      playbackStatus: value.state.playbackStatus ?? "PAUSED",
      positionSeconds: Number(value.state.positionSeconds ?? 0),
      updatedAt:
        value.state.updatedAt ??
        new Date(Number(value.state.createdAt)).toISOString(),
      version: Number(value.state.version ?? 0),
    };
  }
  async execute(
    roomId: string,
    userId: string,
    type: string,
    payload: Record<string, unknown> = {},
    now = Date.now(),
  ) {
    const argument = type.startsWith("room.")
      ? String(payload.positionSeconds ?? 0)
      : JSON.stringify(payload);
    return this.decode(
      await this.redis.eval(
        command,
        4,
        ...this.keys(roomId),
        userId,
        String(now),
        type,
        argument,
        new Date(now).toISOString(),
      ),
    );
  }
  async sweep(roomId: string, now = Date.now()) {
    await this.redis.eval(sweep, 4, ...this.keys(roomId), String(now), roomId);
  }
  private decode(value: unknown): unknown {
    const result = JSON.parse(String(value)) as { error?: string };
    if (result.error) throw new Error(result.error);
    return result;
  }
}
