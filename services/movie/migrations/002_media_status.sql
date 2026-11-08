DO $$ BEGIN
  CREATE TYPE media_status AS ENUM (
    'NONE',
    'UPLOADING',
    'PROCESSING',
    'READY',
    'PROCESSING_FAILED'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE movies
  ADD COLUMN IF NOT EXISTS media_status media_status NOT NULL DEFAULT 'NONE';

ALTER TABLE movies
  ADD COLUMN IF NOT EXISTS hls_master_key TEXT;

ALTER TABLE movies
  ADD COLUMN IF NOT EXISTS original_object_key TEXT;
