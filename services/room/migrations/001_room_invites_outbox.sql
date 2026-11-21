CREATE TABLE IF NOT EXISTS room_invites (
  id UUID PRIMARY KEY,
  room_id UUID NOT NULL,
  inviter_id UUID NOT NULL,
  recipient_id UUID,
  token_hash BYTEA UNIQUE,
  role TEXT NOT NULL DEFAULT 'VIEWER' CHECK (role IN ('VIEWER', 'CONTROLLER')),
  status TEXT NOT NULL DEFAULT 'PENDING'
    CHECK (status IN ('PENDING', 'ACCEPTED', 'REVOKED', 'EXPIRED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,
  CHECK ((recipient_id IS NOT NULL AND token_hash IS NULL)
      OR (recipient_id IS NULL AND token_hash IS NOT NULL))
);

CREATE UNIQUE INDEX IF NOT EXISTS room_invites_pending_recipient_key
  ON room_invites (room_id, recipient_id)
  WHERE recipient_id IS NOT NULL AND status = 'PENDING';
CREATE INDEX IF NOT EXISTS room_invites_pending_room_idx
  ON room_invites (room_id, status, expires_at);

CREATE TABLE IF NOT EXISTS rooms_outbox_events (
  event_id UUID PRIMARY KEY,
  type TEXT NOT NULL CHECK (type = 'ROOM_INVITED'),
  recipient_id UUID NOT NULL,
  payload JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING'
    CHECK (status IN ('PENDING', 'PUBLISHED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  published_at TIMESTAMPTZ,
  retry_count INTEGER NOT NULL DEFAULT 0 CHECK (retry_count >= 0)
);

CREATE INDEX IF NOT EXISTS rooms_outbox_pending_idx
  ON rooms_outbox_events (created_at, event_id)
  WHERE status = 'PENDING';
