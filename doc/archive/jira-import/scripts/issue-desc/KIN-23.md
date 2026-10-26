## Goal

Let admins upload large video files directly to MinIO via presigned multipart URLs, then enqueue transcode.

## Scope

Upload init/complete endpoints, abandoned cleanup, admin upload UI, tests.

## Out of scope

Do not implement FFmpeg transcoding or signed playback in this epic.

## Suggested order

1. KIN-511: `POST /admin/movies/:id/upload/init` — metadata first, presigned multipart URLs
2. KIN-512: `POST /admin/movies/:id/upload/complete` — finalize multipart, set PROCESSING, enqueue transcode
3. KIN-513: Abandoned upload cleanup job (24h)
4. KIN-514: Admin upload UI with direct-to-MinIO multipart + failed-part retry
5. KIN-515: Tests: metadata-first, presigned URLs, complete flow, abandoned cleanup

## References

- 28_JIRA_BACKLOG.md
