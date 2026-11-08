CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$ BEGIN
  CREATE TYPE movie_status AS ENUM ('DRAFT', 'SCHEDULED', 'PUBLISHED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS movies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  genres JSONB NOT NULL DEFAULT '[]'::jsonb,
  status movie_status NOT NULL DEFAULT 'DRAFT',
  publish_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS movie_index_sync_state (
  id TEXT PRIMARY KEY DEFAULT 'default',
  last_successful_sync TIMESTAMPTZ
);

INSERT INTO movie_index_sync_state (id) VALUES ('default')
ON CONFLICT (id) DO NOTHING;
