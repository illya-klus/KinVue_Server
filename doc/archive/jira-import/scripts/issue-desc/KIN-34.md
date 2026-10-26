## Goal

Serve HLS only through short-lived signed URLs — never proxy video bytes through app services.

## Scope

`POST /movies/:id/media-access`, web player integration, security tests.

## Out of scope

Do not add DRM, multi-CDN, or a separate streaming service.

## Suggested order

1. KIN-531: `POST /movies/:id/media-access` — auth required, READY/PUBLISHED only, 10 min signed URL
2. KIN-532: Web player requests media-access before HLS load
3. KIN-533: Tests: unauthorized, expired URL, wrong state, successful playback
4. KIN-534: Verify app services never proxy video bytes

## References

- 28_JIRA_BACKLOG.md
