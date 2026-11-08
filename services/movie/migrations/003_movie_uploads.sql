DO $$ BEGIN
  CREATE TYPE movie_upload_status AS ENUM ('INITIATED', 'COMPLETED', 'ABANDONED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS movie_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  movie_id UUID NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
  object_key TEXT NOT NULL,
  s3_upload_id TEXT NOT NULL,
  status movie_upload_status NOT NULL DEFAULT 'INITIATED',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS movie_uploads_movie_id_idx ON movie_uploads(movie_id);
