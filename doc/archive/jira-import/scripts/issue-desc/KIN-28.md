## Goal

Convert uploaded originals to multi-bitrate HLS in MinIO via FFmpeg and update movie status.

## Scope

Queue `media.transcode`, FFmpeg worker, internal callbacks, retry logic, fixture test.

## Out of scope

Do not build upload UI or signed URL playback in this epic.

## Suggested order

1. KIN-521: RabbitMQ queue `media.transcode` + job schema
2. KIN-522: FFmpeg worker: download original, generate HLS 1080p/720p/480p, upload to MinIO
3. KIN-523: Internal callbacks: transcode-complete → READY, transcode-failed → PROCESSING_FAILED
4. KIN-524: Retry up to 3 attempts before failure
5. KIN-525: Fixture video test: verify playable HLS output

## References

- 28_JIRA_BACKLOG.md
