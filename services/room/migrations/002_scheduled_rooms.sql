CREATE TABLE IF NOT EXISTS scheduled_rooms (
  scheduled_room_id UUID PRIMARY KEY,
  room_id UUID NOT NULL UNIQUE,
  owner_id UUID NOT NULL,
  movie_id UUID NOT NULL,
  visibility TEXT NOT NULL CHECK (visibility IN ('PRIVATE', 'PUBLIC')),
  scheduled_for TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'SCHEDULED'
    CHECK (status IN ('SCHEDULED', 'OPENED', 'CANCELLED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS scheduled_rooms_owner_scheduled_idx
  ON scheduled_rooms (owner_id, scheduled_for, scheduled_room_id);
CREATE INDEX IF NOT EXISTS scheduled_rooms_due_idx
  ON scheduled_rooms (scheduled_for, scheduled_room_id)
  WHERE status = 'SCHEDULED';

CREATE TABLE IF NOT EXISTS scheduled_room_invitees (
  scheduled_room_id UUID NOT NULL
    REFERENCES scheduled_rooms (scheduled_room_id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (scheduled_room_id, user_id)
);

CREATE INDEX IF NOT EXISTS scheduled_room_invitees_user_idx
  ON scheduled_room_invitees (user_id, scheduled_room_id);
