## What to do

Add a MinIO bucket-init sidecar in Docker Compose that creates the `kinvue-media` bucket on startup. Admin uploads and transcoded HLS output will land in this bucket.

## Technical notes

- Object storage: MinIO localhost:9000, bucket `kinvue-media`, console localhost:9001
- Labels: infra, media

## Story points

2

## Depends on

KIN-12

## Acceptance criteria

- `kinvue-media` bucket created on startup
- Bucket init runs automatically with docker compose

## References

- 28_JIRA_BACKLOG.md
- 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md
