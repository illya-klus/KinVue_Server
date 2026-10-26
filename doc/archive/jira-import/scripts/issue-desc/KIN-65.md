## What to do

Scaffold `apps/transcode-worker` with a health endpoint and a stub RabbitMQ consumer for `media.transcode` jobs. FFmpeg HLS transcoding runs here, not in movie-service.

## Technical notes

- Worker: `apps/transcode-worker`; queue `media.transcode`; FFmpeg HLS 1080p/720p/480p
- Labels: backend, media

## Story points

2

## Depends on

KIN-22–KIN-26

## Acceptance criteria

- Meets Definition of Done for KinVue stories (tests pass, PR reviewed, no secrets committed)

## References

- 28_JIRA_BACKLOG.md
- 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md
