import fs from "fs";
import path from "path";

const ROOT = path.resolve("d:/projects/Kinvue_tickets");
const BACKLOG = fs.readFileSync(path.join(ROOT, "28_JIRA_BACKLOG.md"), "utf8");
const PLAN = fs.readFileSync(
  path.join(ROOT, "27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md"),
  "utf8",
);

const issueFiles = [
  "C:/Users/klasi/.cursor/projects/d-projects-Kinvue-tickets/agent-tools/ea48d7ed-3497-451a-a3a7-6d3887aba244.txt",
  "C:/Users/klasi/.cursor/projects/d-projects-Kinvue-tickets/agent-tools/10e8cc78-e027-42eb-bceb-0255b015c993.txt",
];

const jiraIssues = issueFiles.flatMap(
  (f) => JSON.parse(fs.readFileSync(f, "utf8")).issues,
);

// Parse backlog table rows: | KIN-123 | Story | Summary | SP | labels | deps |
const rowRe =
  /^\| (KIN-\d+) \| (Task|Story) \| (.+?) \| (\d+) \| ([^|]+) \| ([^|]+) \|/gm;
const backlogItems = new Map();
let m;
while ((m = rowRe.exec(BACKLOG)) !== null) {
  backlogItems.set(m[1], {
    key: m[1],
    type: m[2],
    summary: m[3].trim(),
    sp: m[4],
    labels: m[5].trim(),
    depends: m[6].trim(),
  });
}

// Parse epic sections
const epicSections = [];
const epicRe =
  /### Epic (KIN-\d+): (.+)\n\n\| Key \| Type \| Summary[\s\S]*?(?=\n---|\n## |$)/g;
while ((m = epicRe.exec(BACKLOG)) !== null) {
  const epicKey = m[1];
  const epicName = m[2].trim();
  const block = m[0];
  const childRows = [...block.matchAll(/^\| (KIN-\d+) \|/gm)].map((x) => x[1]);
  epicSections.push({ epicKey, epicName, childRows, block });
}

const epicByName = new Map();
for (const e of epicSections) {
  epicByName.set(e.epicName.toLowerCase(), e);
}

function extractBacklogId(desc, summary) {
  if (!desc) return null;
  const bl = desc.match(
    /(?:Backlog ID|Backlog Reference|Backlog Epic):\*?\*?\s*(?:BL-)?(KIN-\d+)/i,
  );
  if (bl) return bl[1];
  const bl2 = desc.match(/\*\*Backlog ID:\*\*\s*BL-(\d+)/i);
  if (bl2) return `KIN-${bl2[1]}`;
  // match summary to backlog
  for (const item of backlogItems.values()) {
    if (normalize(summary) === normalize(item.summary)) return item.key;
    if (
      normalize(summary).includes(normalize(item.summary)) ||
      normalize(item.summary).includes(normalize(summary))
    ) {
      return item.key;
    }
  }
  return null;
}

function normalize(s) {
  return s
    .toLowerCase()
    .replace(/`/g, "")
    .replace(/\[epic\]\s*/i, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function extractAcceptanceCriteria(desc, backlogKey) {
  const bullets = [];
  if (desc) {
    const acMatch = desc.match(
      /## Acceptance [Cc]riteria\s*([\s\S]*?)(?=\n## |\n$|$)/,
    );
    if (acMatch) {
      for (const line of acMatch[1].split("\n")) {
        const t = line.trim();
        if (t.startsWith("* ") || t.startsWith("- "))
          bullets.push(t.replace(/^\* /, "- "));
      }
    }
  }
  if (bullets.length) return bullets;

  // backlog-specific AC blocks
  const acBlock = BACKLOG.match(
    new RegExp(
      `\\*\\*${backlogKey} Acceptance Criteria\\*\\*\\s*([\\s\\S]*?)(?=\\n---|\\n### |\\n## |$)`,
    ),
  );
  if (acBlock) {
    for (const line of acBlock[1].split("\n")) {
      const t = line.trim();
      if (t.startsWith("- ")) bullets.push(t);
    }
  }

  return bullets.length
    ? bullets
    : [
        "- Meets Definition of Done for KinVue stories (tests pass, PR reviewed, no secrets committed)",
      ];
}

function serviceFromLabels(labels, summary) {
  const s = summary.toLowerCase();
  if (s.includes("apps/gateway") || s.includes("gateway"))
    return "apps/gateway (port 4000)";
  if (
    s.includes("auth-service") ||
    s.includes("/auth/") ||
    s.includes("jwks") ||
    labels.includes("auth")
  )
    return "apps/auth-service (port 4001)";
  if (
    s.includes("users-service") ||
    s.includes("/users/") ||
    s.includes("friend") ||
    labels.includes("users")
  )
    return "apps/users-service (port 4002)";
  if (
    s.includes("movie-service") ||
    s.includes("/movies/") ||
    s.includes("watchlist") ||
    s.includes("meilisearch") ||
    labels.includes("movies")
  )
    return "apps/movie-service (port 4003)";
  if (
    s.includes("rooms-service") ||
    s.includes("/rooms") ||
    s.includes("websocket") ||
    s.includes("redis") ||
    labels.includes("rooms")
  )
    return "apps/rooms-service (HTTP 4004, WebSocket 4014)";
  if (s.includes("notifications") || s.includes("rabbitmq"))
    return "apps/notifications-service (port 4005)";
  if (s.includes("transcode") || s.includes("ffmpeg"))
    return "apps/transcode-worker";
  if (
    s.includes("apps/web") ||
    s.includes("vite") ||
    s.includes("playwright") ||
    labels.includes("frontend")
  )
    return "apps/web (port 3000)";
  if (s.includes("packages/"))
    return summary.match(/packages\/[\w-]+/)?.[0] ?? "packages/";
  if (s.includes("docker-compose") || s.includes("infra/"))
    return "infra/docker-compose.yml";
  return null;
}

function buildWhatToDo(item, summary, labels) {
  const svc = serviceFromLabels(labels, summary);
  const key = item?.key ?? "";
  const sum = item?.summary ?? summary.replace(/^\[Epic\]\s*/i, "");

  const templates = {
    "KIN-1": `Install Node.js 20 LTS, pnpm, Docker Desktop, and FFmpeg on your workstation, then confirm each tool runs from the terminal. KinVue cannot be built until this baseline toolchain is in place. No repository code is touched in this task — only your local environment.`,
    "KIN-2": `Initialize the KinVue git repository at the project root: create \`.gitignore\`, commit the existing documentation pack, and push to \`main\`. This preserves the architecture docs and implementation plan before any application code lands.`,
    "KIN-3": `Set up the pnpm + Turbo monorepo skeleton at the repo root with workspace scripts \`dev\`, \`build\`, \`test\`, \`lint\`, and \`typecheck\`. Every KinVue app and package will live inside this workspace, so getting the structure right now prevents rework later.`,
    "KIN-4": `Add strict shared TypeScript and Prettier configuration at the monorepo root (\`tsconfig.base.json\`, \`.prettierrc\`). All services and packages inherit these settings for consistent type-checking and formatting.`,
    "KIN-5": `Create the target folder layout: \`apps/\`, \`packages/\`, \`infra/\`, \`tests/\`, \`scripts/\`, and \`docs/\`. This mirrors the architecture in \`27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md\` and tells every future task where code belongs.`,
    "KIN-11": `Create \`infra/docker-compose.yml\` with Auth PostgreSQL on port 5433 and Movie PostgreSQL on port 5434. These databases back auth-service and movie-service; local services cannot start without them.`,
    "KIN-12": `Extend \`infra/docker-compose.yml\` with MongoDB (27017), Redis (6379), RabbitMQ (5672/15672), Meilisearch (7700), and MinIO (9000/9001). KinVue depends on all of these for users, rooms, search, messaging, and media.`,
    "KIN-13": `Add a MinIO bucket-init sidecar in Docker Compose that creates the \`kinvue-media\` bucket on startup. Admin uploads and transcoded HLS output will land in this bucket.`,
    "KIN-14": `Add Prometheus (9090) and Grafana (3001) services to \`infra/docker-compose.yml\`. These give the team local metrics and dashboards before production observability is wired up.`,
    "KIN-15": `Create \`.env.example\` listing every required environment variable and document the port map (Gateway 4000, Auth 4001, etc.). Juniors copy this to \`.env\` to run services locally without guessing config.`,
    "KIN-16": `Start the full Docker Compose stack with \`pnpm infra:up\` and verify every container is healthy — RabbitMQ UI, MinIO console, Meilisearch \`/health\`, and both PostgreSQL instances. Block downstream service work until infra is green.`,
    "KIN-21": `Create \`packages/config\` with Zod-validated environment loading — one schema per service so missing vars fail fast at startup. Every KinVue microservice imports this package instead of reading \`process.env\` directly.`,
    "KIN-22": `Create \`packages/logger\` emitting structured JSON logs with fields \`service\`, \`requestId\`, \`userId\`, \`route\`, \`durationMs\`, and \`error\`. Consistent logs are required for debugging distributed flows like registration Saga and room sync.`,
    "KIN-23": `Create \`packages/errors\` with shared error codes (\`UNAUTHENTICATED\`, \`FORBIDDEN\`, \`VALIDATION_FAILED\`, etc.) and HTTP status mapping. Gateway and all services return the same JSON error shape to the web client.`,
    "KIN-24": `Create \`packages/jwt\` with an RS256 JWKS verification helper checking issuer, audience, expiration, and scopes. Gateway and rooms-service use this for local JWT validation without calling auth on every request.`,
    "KIN-25": `Create \`packages/contracts\` with shared DTOs and domain event types for Auth, Users, Movies, Rooms, and Notifications. Keeps request/response shapes consistent across service boundaries.`,
    "KIN-26": `Create \`packages/testing\` with helpers to clean PostgreSQL, MongoDB, and Redis between tests plus HTTP request utilities. Integration tests across services depend on this package.`,
    "KIN-27": `Write unit tests for \`packages/config\`, \`packages/errors\`, \`packages/logger\`, and JWT validation failure cases. Catch misconfiguration and auth edge cases before services consume these packages.`,
    "KIN-31": `Scaffold \`apps/gateway\` on port 4000 with \`GET /health/live\`, \`GET /health/ready\`, \`GET /metrics\`, and shared JSON error responses. Gateway is the only HTTP entry point for the web app.`,
    "KIN-32": `Scaffold \`apps/auth-service\` on port 4001 with health, readiness, and Prometheus metrics endpoints. Auth owns identity, credentials, refresh sessions, and JWKS.`,
    "KIN-33": `Scaffold \`apps/users-service\` on port 4002 with health, readiness, and metrics. Users owns profiles, friendships, and social graph data in MongoDB.`,
    "KIN-34": `Scaffold \`apps/movie-service\` on port 4003 with health, readiness, and metrics. Movie owns catalog metadata, watchlist, search indexing, and media keys in PostgreSQL.`,
    "KIN-35": `Scaffold \`apps/rooms-service\` with HTTP on port 4004 and a WebSocket listener placeholder on port 4014. Rooms owns ephemeral watch-together state in Redis.`,
    "KIN-36": `Scaffold \`apps/notifications-service\` on port 4005 with health, readiness, and metrics. It consumes RabbitMQ events and stores in-app notifications.`,
    "KIN-37": `Scaffold \`apps/transcode-worker\` with a health endpoint and a stub RabbitMQ consumer for \`media.transcode\` jobs. FFmpeg HLS transcoding runs here, not in movie-service.`,
    "KIN-38": `Add a Dockerfile for each app under \`apps/\` and register all services in \`infra/docker-compose.yml\`. Enables running the full KinVue stack locally with one command.`,
    "KIN-39": `Verify every service health endpoint responds on ports 4000–4005 after \`pnpm infra:up\` and \`pnpm dev\`. Confirms Docker wiring and service skeletons before feature work begins.`,
    "KIN-101": `Add Auth PostgreSQL migrations in \`apps/auth-service\` for the \`auth_identities\` table with status constraint and unique email. Auth is the source of truth for login credentials and registration state.`,
    "KIN-102": `Add the \`refresh_sessions\` table with indexes on \`user_id\` and \`expires_at\` in auth-service. Supports refresh-token rotation (30-day TTL) used by login and logout.`,
    "KIN-103": `Add the \`auth_outbox_events\` table for durable Auth domain events. Uses the transactional outbox pattern for reliable RabbitMQ publishing later.`,
    "KIN-104": `Write a migration test that applies the full Auth schema to an empty test database. Ensures migrations are repeatable in CI and fresh environments.`,
    "KIN-111": `Create the MongoDB \`users\` collection schema in users-service with unique lowercase \`username\`. Profiles are created during registration Saga after Auth generates global \`userId\`.`,
    "KIN-112": `Create the MongoDB \`friendships\` collection with canonical pair normalization (\`user1Id\` < \`user2Id\`). Prevents duplicate friend relationships in either direction.`,
    "KIN-113": `Add MongoDB indexes on \`username\`, \`displayName\`, \`user1Id\`, \`user2Id\`, \`status\`, and \`createdAt\` in users-service. Required for user search and friend request queries at scale.`,
    "KIN-114": `Write tests proving duplicate friendship pairs cannot be inserted in either direction. Validates the normalization helper before friend-request APIs ship.`,
    "KIN-121": `Implement Argon2id password hashing and RS256 signing key generation in auth-service. Passwords never leave Auth; JWT access tokens expire in 15 minutes.`,
    "KIN-122": `Expose \`GET /.well-known/jwks.json\` from auth-service (port 4001). Gateway and rooms-service cache these public keys for local JWT verification.`,
    "KIN-123": `Implement \`POST /auth/login\` in auth-service — only \`ACTIVE\` users, returns access + refresh tokens. Gateway proxies this as a public route.`,
    "KIN-124": `Implement \`POST /auth/refresh\` with refresh-token rotation: revoke old session, issue new pair. Prevents refresh-token reuse attacks.`,
    "KIN-125": `Implement \`POST /auth/logout\` to revoke the current refresh session in PostgreSQL. Called through Gateway on authenticated routes.`,
    "KIN-126": `Implement the registration Saga in \`POST /auth/register\`: generate \`userId\`, write Auth identity (\`PENDING\` → \`PROFILE_CREATING\` → \`ACTIVE\`), call users-service \`POST /internal/users/profiles\` idempotently, retry 3× on failure, compensate with 503. This is the most critical cross-service flow in KinVue.`,
    "KIN-127": `Add auth-service unit tests for hashing, token claims, refresh rotation, inactive login rejection, and duplicate email (409).`,
    "KIN-128": `Add auth-service integration tests for successful registration Saga, Users unavailable retry, and compensation path. Proves the Saga does not return false success.`,
    "KIN-131": `Implement idempotent \`POST /internal/users/profiles\` in users-service — same \`userId\` returns 200 with existing profile. Called by Auth during registration Saga.`,
    "KIN-132": `Implement \`GET /users/me\` and \`PATCH /users/me\` in users-service. Gateway forwards these with \`x-user-id\` header after JWT validation.`,
    "KIN-133": `Implement \`GET /users/search?query=&limit=&cursor=\` in users-service — minimum 2 characters, cursor pagination on MongoDB username/displayName.`,
    "KIN-134": `Implement friend request endpoints in users-service: create, incoming, outgoing, accept, reject. Uses normalized friendship pairs and rejects self-requests.`,
    "KIN-135": `Implement \`GET /friends\` in users-service returning accepted friendships for the authenticated user.`,
    "KIN-136": `Emit \`FRIEND_REQUEST_CREATED\` and \`FRIEND_REQUEST_ACCEPTED\` events to MongoDB \`outbox_events\` after friendship actions. Notifications-service consumes these via RabbitMQ.`,
    "KIN-137": `Build an outbox publisher in users-service that sends pending friendship events to RabbitMQ exchange \`kinvue.domain\`. Requires RabbitMQ from Docker Compose (port 5672).`,
    "KIN-138": `Add users-service tests for idempotent profile create, pair normalization, accept/reject authorization, and outbox event creation.`,
    "KIN-201": `Add request-ID middleware in \`apps/gateway\` and forward \`x-request-id\`, \`x-user-id\`, and \`x-user-scopes\` to upstream services. Enables distributed tracing across KinVue.`,
    "KIN-202": `Implement Gateway public routes (no JWT): register, login, refresh, JWKS, movie search/detail. Proxy to auth-service (4001) and movie-service (4003).`,
    "KIN-203": `Implement Gateway JWT middleware using \`packages/jwt\` with 5-minute JWKS cache and immediate refresh on unknown \`kid\`. Validates issuer \`kinvue-auth\`, audience \`kinvue\`.`,
    "KIN-204": `Implement Gateway authenticated routes for users, friends, watchlist, rooms control, and media-access. Proxy to users-service (4002), movie-service (4003), rooms-service (4004).`,
    "KIN-205": `Implement Gateway admin routes with \`admin\` scope guard for movie CRUD, upload, and publish endpoints.`,
    "KIN-206": `Add Gateway rate limits: login 5/min/IP, register 3/min/IP, search 60/min/user, rooms 30/min/user, default 300/min/user.`,
    "KIN-207": `Add Gateway tests: expired JWT → 401, bad signature → 401, missing scope → 403, upstream 503 mapping, request-ID forwarding.`,
    "KIN-211": `Create the Vite React TypeScript app in \`apps/web\` (port 3000) with routing shell for register, login, search, profile, friends, rooms, and admin pages.`,
    "KIN-212": `Build the web API client talking only to Gateway (port 4000) plus an auth state store for access tokens. Web must never call microservices directly.`,
    "KIN-213": `Implement automatic access-token refresh on HTTP 401 and a logout flow calling Gateway \`POST /auth/logout\`. Keeps users signed in without manual re-login.`,
    "KIN-214": `Add protected and admin route wrappers in \`apps/web\` checking auth state and \`admin\` scope. Unauthenticated users redirect to login; non-admins cannot reach admin pages.`,
    "KIN-215": `Add shared UI states in \`apps/web\`: loading, empty, error, unauthorized, and forbidden. Every page uses these for consistent UX.`,
    "KIN-216": `Add a Playwright smoke test that the homepage loads. First automated check that the web shell builds and serves.`,
    "KIN-221": `Build the register page in \`apps/web\` with validation (password min 12 chars) calling Gateway \`POST /auth/register\`.`,
    "KIN-222": `Build the login page calling Gateway \`POST /auth/login\` and redirect to movie search on success.`,
    "KIN-223": `Handle duplicate email (409) and duplicate username error messages on the register page with clear user-facing text.`,
    "KIN-224": `E2E test: register → login → profile loads. Validates the full auth vertical slice through Gateway.`,
    "KIN-225": `Manual failure test: kill users-service during registration and verify the UI does not show false success. Proves Saga compensation works end-to-end.`,
    "KIN-231": `Build profile view and edit form in \`apps/web\` using \`GET /users/me\` and \`PATCH /users/me\` via Gateway.`,
    "KIN-232": `Build user search page with minimum 2 characters before calling \`GET /users/search\`.`,
    "KIN-233": `Build friend requests UI: send, incoming list, outgoing list, accept, and reject actions.`,
    "KIN-234": `Build friends list page showing accepted friendships via \`GET /friends\`.`,
    "KIN-235": `E2E test: user A finds user B, sends request, B accepts, both see friendship in friends list.`,
    "KIN-301": `Add Movie PostgreSQL migrations in movie-service for \`movies\` table with status constraint and indexes. PostgreSQL is the movie catalog source of truth.`,
    "KIN-302": `Add \`movie_uploads\`, \`watchlist_items\`, \`movie_index_sync_state\`, and \`movie_outbox_events\` tables in movie-service.`,
    "KIN-311": `Implement admin \`POST /admin/movies\` and \`PATCH /admin/movies/:id\` in movie-service — new movies start as \`DRAFT\`. Gateway admin scope required.`,
    "KIN-312": `Implement admin publish-now and schedule-publish endpoints in movie-service. Publish updates PostgreSQL first, then Meilisearch.`,
    "KIN-313": `Implement public \`GET /movies/:id\` and \`GET /movies/search\` returning only \`PUBLISHED\` movies. Search hits Meilisearch index \`movies\` (port 7700).`,
    "KIN-314": `Implement watchlist add, remove, and list endpoints in movie-service storing \`user_id\` + \`movie_id\` rows.`,
    "KIN-315": `Set up Meilisearch index \`movies\` and upsert documents on publish. Searchable: title, description, genres.`,
    "KIN-316": `Implement scheduled publish worker running every 60 seconds to flip \`SCHEDULED\` movies to \`PUBLISHED\`.`,
    "KIN-317": `Implement search reconciliation job every 5 minutes with 24-hour overlap and safe checkpoint in \`movie_index_sync_state\`.`,
    "KIN-318": `Add CLI \`pnpm --filter movie-service search:rebuild\` for full Meilisearch index rebuild from PostgreSQL.`,
    "KIN-319": `Add movie-service tests: publish, schedule, Meilisearch failure recovery, watchlist, search filters.`,
    "KIN-321": `Build admin movie create/edit pages in \`apps/web\` calling Gateway admin movie endpoints.`,
    "KIN-322": `Build admin publish-now and schedule-publish UI actions on the movie admin pages.`,
    "KIN-323": `Build movie search page with 300 ms debounce and minimum 2 characters before querying Gateway \`GET /movies/search\`.`,
    "KIN-324": `Build movie detail page with watchlist add/remove actions via Gateway watchlist endpoints.`,
    "KIN-325": `Build watchlist page listing saved movies for the logged-in user.`,
    "KIN-326": `E2E test: admin publishes movie → user searches → saves to watchlist.`,
    "KIN-401": `Implement Redis key helpers and room state/member schemas in rooms-service. Keys: \`room:{roomId}:state\`, \`:members\`, \`:messages\`, \`:seenMessageIds\`, \`:events\`.`,
    "KIN-402": `Implement \`POST /rooms\` in rooms-service — private/public visibility, capacity 20, 6-hour Redis TTL. Owner stored as first member with role \`OWNER\`.`,
    "KIN-403": `Implement \`GET /rooms/public\` listing open public rooms from Redis.`,
    "KIN-404": `Implement \`POST /rooms/:id/invites\` (owner only, default \`VIEWER\` role) and emit \`ROOM_INVITED\` outbox event for notifications.`,
    "KIN-405": `Implement \`POST /rooms/:id/permissions\` allowing owner to grant \`CONTROLLER\` role to participants.`,
    "KIN-406": `Implement \`POST /rooms/:id/close\` (owner only) setting \`closed=true\` and shortening Redis TTL to 15 minutes.`,
    "KIN-407": `Add rooms-service HTTP tests: create, invite authz, permission changes, close, TTL, capacity limits.`,
    "KIN-411": `Expose WebSocket endpoint \`ws://localhost:4014/rooms\` in rooms-service with JWT handshake using \`packages/jwt\`. Client sends \`accessToken\` and \`roomId\`.`,
    "KIN-412": `Implement room access checks on WebSocket connect: public/private, closed state, capacity 20, invite list for private rooms.`,
    "KIN-413": `Send \`room.state_sync\` to the client immediately after successful WebSocket connect with authoritative Redis playback state.`,
    "KIN-414": `Implement heartbeat every 30 s, mark stale after 75 s, presence values \`ONLINE\`/\`DISCONNECTED\`/\`LEFT\`. Publish presence via Redis Pub/Sub.`,
    "KIN-415": `Add WebSocket tests: valid handshake, invalid JWT, private access denial, reconnect state sync.`,
    "KIN-421": `Handle WebSocket events \`room.play\`, \`room.pause\`, \`room.seek\` with permission checks — only \`OWNER\` and \`CONTROLLER\` may control playback.`,
    "KIN-422": `Store sync point in Redis (\`playbackStatus\`, \`positionSeconds\`, \`updatedAt\`, monotonic \`version\`) on each playback command.`,
    "KIN-423": `Implement Redis Pub/Sub fan-out on channel \`room:{roomId}:events\` across Rooms instances — subscribe only to rooms with local sockets.`,
    "KIN-424": `Broadcast \`room.playback_state_changed\` with monotonic \`version\`; clients ignore older versions. Target propagation under 200 ms.`,
    "KIN-425": `Multi-instance test: user A pauses on Rooms instance 1, user B receives event on instance 2 via Redis Pub/Sub.`,
    "KIN-426": `Reconnect test: client reads authoritative Redis state via \`room.state_sync\` without Pub/Sub replay.`,
    "KIN-431": `Handle \`chat.message\` WebSocket event with client \`messageId\`, 1000-char limit, stored in Redis list \`room:{roomId}:messages\` with 24 h TTL.`,
    "KIN-432": `Implement idempotent chat retry using Redis set \`room:{roomId}:seenMessageIds\` — duplicate \`messageId\` from same author does not duplicate visible message.`,
    "KIN-433": `Handle \`chat.reaction\` with allowed emoji set: \`like\`, \`laugh\`, \`wow\`, \`sad\`, \`fire\`. Ephemeral — not persisted beyond room TTL.`,
    "KIN-434": `Add chat/reaction tests: validation, duplicate messageId, cross-instance delivery via Pub/Sub.`,
    "KIN-441": `Build create-room UI on movie detail page in \`apps/web\`: solo watch, private room, or public room via Gateway \`POST /rooms\`.`,
    "KIN-442": `Build public rooms list and join flow calling \`GET /rooms/public\` and WebSocket connect.`,
    "KIN-443": `Build invite-friend UI and copy-invite-URL action calling \`POST /rooms/:id/invites\`.`,
    "KIN-444": `Build participants list and owner permission controls on the room page.`,
    "KIN-445": `Integrate HLS player in room page synced with \`room.playback_state_changed\` — owner/controller controls enabled, viewer controls disabled.`,
    "KIN-446": `Build chat panel and reaction buttons on the room page using WebSocket \`chat.message\` and \`chat.reaction\` events.`,
    "KIN-447": `Show reconnect banner on WebSocket disconnect; wait for \`room.state_sync\` before applying local playback controls.`,
    "KIN-448": `E2E test with two browsers: play/pause/seek/chat/reaction/reconnect in one room.`,
    "KIN-501": `Set up RabbitMQ topology in notifications-service: exchange \`kinvue.domain\`, queue \`notifications.events\`, DLQ, bindings for \`ROOM_INVITED\`, \`FRIEND_REQUEST_CREATED\`, \`FRIEND_REQUEST_ACCEPTED\`.`,
    "KIN-502": `Implement RabbitMQ consumer with manual ACK, 2 retries, DLQ on exhaustion in notifications-service.`,
    "KIN-503": `Implement dedup by \`eventId\` in \`processed_notification_events\` table plus in-app \`notifications\` store in PostgreSQL.`,
    "KIN-504": `Implement \`GET /notifications\` and \`POST /notifications/:id/read\` in notifications-service (port 4005).`,
    "KIN-505": `Add Gateway notification routes and web notification bell UI in \`apps/web\`.`,
    "KIN-506": `Add notifications tests: ACK timing, retry, DLQ, duplicate suppression.`,
    "KIN-511": `Implement \`POST /admin/movies/:id/upload/init\` in movie-service — metadata first, presigned multipart URLs to MinIO (\`kinvue-media\` bucket, port 9000).`,
    "KIN-512": `Implement \`POST /admin/movies/:id/upload/complete\` — finalize multipart, set status \`PROCESSING\`, enqueue \`media.transcode\` job to RabbitMQ.`,
    "KIN-513": `Implement abandoned upload cleanup job marking uploads older than 24 h as \`ABANDONED\`.`,
    "KIN-514": `Build admin upload UI in \`apps/web\` uploading parts directly to MinIO (not through Gateway) with failed-part retry.`,
    "KIN-515": `Add upload tests: metadata-first, presigned URLs, complete flow, abandoned cleanup.`,
    "KIN-521": `Create RabbitMQ queue \`media.transcode\` and job schema in transcode-worker.`,
    "KIN-522": `Implement FFmpeg worker: download original from MinIO, generate HLS 1080p/720p/480p renditions, upload to \`movies/{movieId}/hls/\`.`,
    "KIN-523": `Add internal callbacks \`POST /internal/movies/:id/transcode-complete\` → \`READY\` and transcode-failed → \`PROCESSING_FAILED\` in movie-service.`,
    "KIN-524": `Retry transcode jobs up to 3 attempts before marking \`PROCESSING_FAILED\`.`,
    "KIN-525": `Fixture video test: verify generated HLS playlist is playable locally.`,
    "KIN-531": `Implement \`POST /movies/:id/media-access\` in movie-service — auth required, \`READY\`/\`PUBLISHED\` only, 10-minute signed MinIO URL for HLS master playlist.`,
    "KIN-532": `Update web HLS player to request media-access before loading stream. Video bytes must never flow through Gateway or app services.`,
    "KIN-533": `Add media-access tests: unauthorized, expired URL, wrong state, successful playback.`,
    "KIN-534": `Verify application services never proxy video bytes — segments load directly from signed MinIO/CDN URLs.`,
    "KIN-601": `Add \`scheduled_rooms\` table and CRUD endpoints in movie-service PostgreSQL. Statuses: \`SCHEDULED\`, \`OPENED\`, \`CANCELLED\`.`,
    "KIN-602": `Implement scheduler that creates Redis room when \`scheduled_for\` is due, marks \`OPENED\`, and emits invite events.`,
    "KIN-603": `Build schedule-watch form on movie detail and scheduled-rooms page in \`apps/web\`.`,
    "KIN-604": `Tests: create schedule, cancel, due open, invitee notification.`,
    "KIN-611": `Add Prometheus metrics to all services — HTTP counters/histograms plus Rooms WebSocket metrics (\`active_websockets\`, \`playback_commands_per_second\`, etc.).`,
    "KIN-612": `Create Grafana dashboards: KinVue Overview, KinVue Rooms, KinVue Media in \`infra/grafana/\`.`,
    "KIN-613": `Write \`docs/runbooks/observability.md\` documenting metrics, dashboards, and alert guidance.`,
    "KIN-621": `Add input validation and body size limits on all external endpoints across Gateway and services.`,
    "KIN-622": `Configure CORS allowlist, secret scanning, and dependency scanning in GitHub Actions CI.`,
    "KIN-623": `Add security tests: private room denial, viewer playback denial, admin guard, expired JWT, upload type denial.`,
    "KIN-624": `Write \`docs/runbooks/security.md\` documenting token, JWKS, upload, and admin authorization controls.`,
    "KIN-631": `Create \`.github/workflows/ci.yml\` running install, lint, typecheck, and unit tests on Node 20 + pnpm.`,
    "KIN-632": `Extend CI to start Docker Compose, run integration tests and Playwright smoke tests.`,
    "KIN-633": `Upload test artifacts (Playwright reports, coverage) on CI failure.`,
    "KIN-701": `Build E2E suite covering all 20 user journeys from implementation plan Phase 29 in \`tests/e2e/\`.`,
    "KIN-702": `Add failure tests: Gateway/Auth/Users/Rooms/Redis/Meilisearch/RabbitMQ/transcode crash scenarios.`,
    "KIN-703": `Create load test scripts in \`tests/load/\` for Gateway, search, Rooms WS, chat, notifications, and media.`,
    "KIN-704": `Document capacity results in \`docs/runbooks/capacity-results.md\`.`,
    "KIN-711": `Create production Dockerfiles and deployment environment variable documentation for all apps.`,
    "KIN-712": `Provision MVP infrastructure (DBs, Redis, RabbitMQ, object storage, CDN) within <= $300/month budget.`,
    "KIN-713": `Deploy services, run migrations, Meilisearch setup, and smoke tests against production Gateway and WebSocket.`,
    "KIN-714": `Write \`docs/runbooks/deployment.md\`.`,
    "KIN-721": `Update README, implementation plan references, open questions, and data model docs after MVP deploy.`,
    "KIN-722": `Run final acceptance checklist (Phase 34) verifying all FR/NFR requirements.`,
    "KIN-723": `Tag release \`v0.1.0-mvp\` on \`main\`.`,
  };

  if (templates[key]) return templates[key];

  // Generic fallback from summary + service
  const where = svc
    ? `Work in ${svc}.`
    : "Work in the KinVue monorepo at the path indicated by the task summary.";
  return `${sum}. ${where} This task is part of building KinVue's social watch-together platform — follow the acceptance criteria and linked implementation plan for exact behavior.`;
}

function buildTechnicalNotes(item, summary, backlogKey) {
  const notes = [];
  const s = summary.toLowerCase();

  if (s.includes("toolchain") || s.includes("verify versions")) {
    notes.push(
      "Run: `node --version`, `pnpm --version`, `docker --version`, `ffmpeg -version`",
    );
    notes.push("Install pnpm globally: `npm install -g pnpm`");
    notes.push(
      "Use Node 20 LTS; Docker Desktop must be running for later infra tasks",
    );
  }
  if (s.includes("git repo") || s.includes(".gitignore")) {
    notes.push(
      "Commands: `git init`, `git branch -M main`, commit docs pack before app code",
    );
    notes.push("See Phase 0 in `27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md`");
  }
  if (s.includes("turbo monorepo") || s.includes("pnpm-workspace")) {
    notes.push(
      "Root scripts: `dev`, `build`, `test`, `lint`, `typecheck`, `infra:up`",
    );
    notes.push("Files: `package.json`, `pnpm-workspace.yaml`, `turbo.json`");
  }
  if (s.includes("typescript") && s.includes("prettier"))
    notes.push("Files: `tsconfig.base.json`, `.prettierrc` at repo root");
  if (s.includes("folder structure"))
    notes.push(
      "Create: `apps/`, `packages/`, `infra/`, `tests/`, `scripts/`, `docs/`",
    );
  if (s.includes("docker-compose") || s.includes("infra/"))
    notes.push("File: `infra/docker-compose.yml`; start with `pnpm infra:up`");
  if (s.includes("packages/config"))
    notes.push("Package: `packages/config`; use Zod schemas per service");
  if (s.includes("packages/logger"))
    notes.push(
      "Log fields: `service`, `requestId`, `userId`, `route`, `durationMs`, `error`",
    );
  if (s.includes("packages/jwt"))
    notes.push("RS256 verification; issuer `kinvue-auth`, audience `kinvue`");
  if (
    s.includes("auth-service") ||
    (s.includes("/auth/") && !s.includes("gateway"))
  )
    notes.push(
      "Service: `apps/auth-service` port 4001; DB `AUTH_DATABASE_URL` postgresql://localhost:5433",
    );
  if (
    s.includes("users-service") ||
    s.includes("/users/") ||
    s.includes("friend")
  )
    notes.push(
      "Service: `apps/users-service` port 4002; MongoDB `USERS_MONGO_URL` mongodb://localhost:27017/kinvue_users",
    );
  if (
    s.includes("movie-service") ||
    s.includes("/movies/") ||
    s.includes("watchlist") ||
    s.includes("meilisearch")
  )
    notes.push(
      "Service: `apps/movie-service` port 4003; DB postgresql://localhost:5434; Meilisearch http://localhost:7700",
    );
  if (
    s.includes("rooms") ||
    s.includes("websocket") ||
    (s.includes("redis") && !s.includes("packages/testing"))
  )
    notes.push(
      "Service: `apps/rooms-service` HTTP 4004, WS ws://localhost:4014/rooms; Redis `redis://localhost:6379`",
    );
  if (s.includes("notifications") || s.includes("rabbitmq"))
    notes.push(
      "Service: `apps/notifications-service` port 4005; RabbitMQ amqp://localhost:5672, management UI localhost:15672",
    );
  if (
    s.includes("transcode") ||
    (s.includes("ffmpeg") && !s.includes("verify versions"))
  )
    notes.push(
      "Worker: `apps/transcode-worker`; queue `media.transcode`; FFmpeg HLS 1080p/720p/480p",
    );
  if (s.includes("gateway"))
    notes.push(
      "Service: `apps/gateway` port 4000; sole HTTP entry for web client",
    );
  if (
    s.includes("vite") ||
    s.includes("react") ||
    s.includes("playwright") ||
    s.includes("page")
  )
    notes.push("App: `apps/web` port 3000; HTTP calls go to Gateway only");
  if (s.includes("minio") || s.includes("upload"))
    notes.push(
      "Object storage: MinIO localhost:9000, bucket `kinvue-media`, console localhost:9001",
    );
  if (s.includes("prometheus") || s.includes("grafana"))
    notes.push("Prometheus localhost:9090; Grafana localhost:3001");
  if (
    s.includes("github actions") ||
    s.includes("ci pipeline") ||
    s.includes("ci.yml")
  )
    notes.push("File: `.github/workflows/ci.yml`; Node 20 + pnpm 9");
  if (s.includes("migration"))
    notes.push(
      "Use service-local migration tooling; test against empty DB in CI",
    );
  if (s.includes("e2e") || s.includes("playwright"))
    notes.push("Tests live in `tests/e2e/`; run with `pnpm test:e2e`");

  if (item?.labels) notes.push(`Labels: ${item.labels}`);
  if (notes.length === 0)
    notes.push(
      "See `27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md` for step-by-step commands and payloads",
    );

  return notes.slice(0, 6);
}

const jiraEpicToBacklogEpic = {
  "developer environment & repo bootstrap": "KIN-0",
  "local infrastructure (docker compose)": "KIN-10",
  "shared packages": "KIN-20",
  "service skeletons": "KIN-30",
  "auth data model": "KIN-100",
  "users data model": "KIN-110",
  "auth service api": "KIN-120",
  "users service api": "KIN-130",
  "api gateway": "KIN-200",
  "web app foundation": "KIN-210",
  "auth ui vertical slice": "KIN-220",
  "social ui vertical slice": "KIN-230",
  "movie data model": "KIN-300",
  "movie service api": "KIN-310",
  "movie ui": "KIN-320",
  "rooms http control api": "KIN-400",
  "rooms websocket + presence": "KIN-410",
  "playback synchronization": "KIN-420",
  "room chat & reactions": "KIN-430",
  "room web experience": "KIN-440",
  "notifications service": "KIN-500",
  "admin media upload": "KIN-510",
  "transcoding worker": "KIN-520",
  "signed media playback": "KIN-530",
  "scheduled watch rooms": "KIN-600",
  observability: "KIN-610",
  "security hardening": "KIN-620",
  "ci/cd pipeline": "KIN-630",
  "end-to-end test suite": "KIN-700",
  "mvp deployment": "KIN-710",
  "documentation refresh & release": "KIN-720",
};

function buildEpicDescription(epicName, epicSection, existingDesc = "") {
  const name = epicName.replace(/^\[Epic\]\s*/i, "").trim();
  let backlogEpicKey = jiraEpicToBacklogEpic[name.toLowerCase()];
  if (!backlogEpicKey) {
    const fromDesc = existingDesc.match(/Backlog Epic:\*?\*?\s*(KIN-\d+)/i);
    if (fromDesc) backlogEpicKey = fromDesc[1];
  }
  const section = backlogEpicKey
    ? epicSections.find((e) => e.epicKey === backlogEpicKey)
    : epicSection;
  const childKeys = section?.childRows ?? [];
  const childSummaries = childKeys
    .map((k) => backlogItems.get(k))
    .filter(Boolean)
    .map((c) => `${c.key}: ${c.summary}`);

  const scopeMap = {
    "Developer Environment & Repo Bootstrap": {
      goal: "Give every developer a working local toolchain, git repo, and pnpm/Turbo monorepo so KinVue application code can be added safely.",
      scope:
        "Toolchain install, git init, monorepo scripts, TypeScript/Prettier config, and root folder structure.",
      out: "Do not add Docker services, microservice code, or feature APIs in this epic.",
    },
    "Local Infrastructure (Docker Compose)": {
      goal: "Provide all local backing services (databases, cache, messaging, search, object storage, observability) via Docker Compose.",
      scope:
        "PostgreSQL ×2, MongoDB, Redis, RabbitMQ, Meilisearch, MinIO + bucket init, Prometheus, Grafana, `.env.example`, health verification.",
      out: "Do not implement business logic or HTTP APIs — only infrastructure containers and env documentation.",
    },
    "Shared Packages": {
      goal: "Centralize cross-cutting concerns (config, logging, errors, JWT, contracts, test helpers) used by every KinVue service.",
      scope:
        "`packages/config`, `logger`, `errors`, `jwt`, `contracts`, `testing` plus unit tests.",
      out: "Do not build HTTP endpoints or UI — packages only.",
    },
    "Service Skeletons": {
      goal: "Scaffold every KinVue microservice with health, readiness, metrics, Dockerfiles, and docker-compose wiring.",
      scope:
        "gateway, auth-service, users-service, movie-service, rooms-service, notifications-service, transcode-worker on ports 4000–4005 (+ WS 4014).",
      out: "Do not implement registration, rooms, movies, or other feature logic — skeleton endpoints only.",
    },
    "Auth Data Model": {
      goal: "Define Auth PostgreSQL schema for identities, refresh sessions, and outbox events.",
      scope:
        "Migrations for `auth_identities`, `refresh_sessions`, `auth_outbox_events` plus migration tests.",
      out: "Do not implement login/register HTTP handlers in this epic.",
    },
    "Users Data Model": {
      goal: "Define MongoDB schemas for user profiles and friendships with canonical pair normalization.",
      scope:
        "`users` and `friendships` collections, indexes, duplicate-pair tests.",
      out: "Do not implement profile or friend-request HTTP APIs in this epic.",
    },
    "Auth Service API": {
      goal: "Deliver complete authentication: registration Saga, login, refresh rotation, logout, and JWKS.",
      scope:
        "Argon2id hashing, RS256 tokens, all `/auth/*` endpoints, unit and integration tests.",
      out: "Do not build Gateway routing or web UI — auth-service only.",
    },
    "Users Service API": {
      goal: "Deliver profiles, user search, friendships, and RabbitMQ outbox for social notifications.",
      scope:
        "Internal profile endpoint, `/users/me`, search, friend requests, outbox publisher.",
      out: "Do not build web pages or Gateway routes in this epic.",
    },
    "API Gateway": {
      goal: "Provide the single HTTP edge for KinVue: routing, JWT validation, rate limits, and admin scope guards.",
      scope:
        "Public, authenticated, and admin route proxies; JWKS cache; request-ID forwarding; Gateway tests.",
      out: "Do not implement business logic in Gateway — proxy and edge concerns only.",
    },
    "Web App Foundation": {
      goal: "Scaffold the React/Vite client with routing, Gateway-only API client, auth state, and shared UI patterns.",
      scope:
        "`apps/web` shell, protected/admin routes, auth refresh, Playwright homepage smoke test.",
      out: "Do not build feature pages (register form, room player) — foundation only.",
    },
    "Auth UI Vertical Slice": {
      goal: "End-to-end register and login flow through Gateway to Auth and Users, with E2E and failure tests.",
      scope:
        "Register/login pages, error handling, E2E and Saga failure verification.",
      out: "Do not build profile, movies, or rooms UI in this epic.",
    },
    "Social UI Vertical Slice": {
      goal: "Let users view/edit profiles, search users, manage friend requests, and see friends list.",
      scope:
        "Profile, search, friend request, and friends pages plus social E2E test.",
      out: "Do not build movie search or watch rooms in this epic.",
    },
    "Movie Data Model": {
      goal: "Define Movie PostgreSQL schema for catalog, uploads, watchlist, search sync state, and outbox.",
      scope:
        "Migrations for `movies`, `movie_uploads`, `watchlist_items`, `movie_index_sync_state`, `movie_outbox_events`.",
      out: "Do not implement search API or admin UI in this epic.",
    },
    "Movie Service API": {
      goal: "Deliver movie catalog CRUD, publish/schedule, Meilisearch indexing, watchlist, and reconciliation.",
      scope:
        "Admin and public movie endpoints, Meilisearch upsert, scheduled publish worker, search rebuild CLI, tests.",
      out: "Do not build web pages or media upload/transcode in this epic.",
    },
    "Movie UI": {
      goal: "Admin and user-facing movie pages: create/edit, publish, search, detail, watchlist.",
      scope:
        "Admin movie pages, debounced search, detail + watchlist actions, movie E2E test.",
      out: "Do not build watch rooms or media upload UI in this epic.",
    },
    "Rooms HTTP Control API": {
      goal: "Room lifecycle over HTTP: create, list public, invite, permissions, close — backed by Redis.",
      scope:
        "Redis schemas, `POST/GET /rooms*` endpoints, `ROOM_INVITED` outbox, HTTP tests.",
      out: "Do not implement WebSocket, playback sync, or room UI in this epic.",
    },
    "Rooms WebSocket + Presence": {
      goal: "WebSocket ingress for watch rooms with JWT auth, access checks, state sync, and presence heartbeat.",
      scope:
        "`ws://localhost:4014/rooms` handshake, `room.state_sync`, heartbeat/presence, WS tests.",
      out: "Do not implement playback commands, chat, or web room page in this epic.",
    },
    "Playback Synchronization": {
      goal: "Synchronize play/pause/seek across room participants via Redis state and Pub/Sub fan-out.",
      scope:
        "Playback events, Redis sync point, cross-instance Pub/Sub, multi-instance and reconnect tests.",
      out: "Do not build chat, reactions, or HLS player UI in this epic.",
    },
    "Room Chat & Reactions": {
      goal: "Ephemeral in-room chat and emoji reactions over WebSocket with Redis storage and idempotent retries.",
      scope:
        "`chat.message`, `chat.reaction`, Redis TTL, duplicate messageId handling, tests.",
      out: "Do not build room page UI or durable chat history in this epic.",
    },
    "Room Web Experience": {
      goal: "Complete watch-room UI: create/join rooms, HLS player synced to playback state, chat, reactions, reconnect.",
      scope:
        "Room creation from movie detail, public list, invites, player, chat panel, 2-browser E2E test.",
      out: "Do not implement notifications bell or admin upload in this epic.",
    },
    "Notifications Service": {
      goal: "Reliable in-app notifications from RabbitMQ friendship and room-invite events with dedup and DLQ.",
      scope:
        "Queue topology, consumer with manual ACK, dedup store, read API, Gateway routes, bell UI, tests.",
      out: "Do not implement push notifications or email in v1.",
    },
    "Admin Media Upload": {
      goal: "Let admins upload large video files directly to MinIO via presigned multipart URLs, then enqueue transcode.",
      scope:
        "Upload init/complete endpoints, abandoned cleanup, admin upload UI, tests.",
      out: "Do not implement FFmpeg transcoding or signed playback in this epic.",
    },
    "Transcoding Worker": {
      goal: "Convert uploaded originals to multi-bitrate HLS in MinIO via FFmpeg and update movie status.",
      scope:
        "Queue `media.transcode`, FFmpeg worker, internal callbacks, retry logic, fixture test.",
      out: "Do not build upload UI or signed URL playback in this epic.",
    },
    "Signed Media Playback": {
      goal: "Serve HLS only through short-lived signed URLs — never proxy video bytes through app services.",
      scope:
        "`POST /movies/:id/media-access`, web player integration, security tests.",
      out: "Do not add DRM, multi-CDN, or a separate streaming service.",
    },
    "Scheduled Watch Rooms": {
      goal: "Let users schedule future watch sessions that auto-open Redis rooms and notify invitees.",
      scope: "`scheduled_rooms` table, CRUD, scheduler, web UI, tests.",
      out: "Do not redesign room WebSocket protocol in this epic.",
    },
    Observability: {
      goal: "Make KinVue operable with Prometheus metrics on every service and Grafana dashboards.",
      scope:
        "HTTP + WS metrics, Prometheus scrape config, Overview/Rooms/Media dashboards, observability runbook.",
      out: "Do not change business logic — instrumentation and dashboards only.",
    },
    "Security Hardening": {
      goal: "Harden KinVue against common attacks: validation, CORS, rate limits, CI scanning, security tests.",
      scope:
        "Body limits, CORS allowlist, secret/dependency scanning, security test suite, security runbook.",
      out: "Do not add new features — hardening only.",
    },
    "CI/CD Pipeline": {
      goal: "Automated quality gate on every PR: lint, typecheck, unit/integration tests, Playwright smoke.",
      scope:
        "GitHub Actions workflow, Docker Compose in CI, artifact upload on failure.",
      out: "Do not deploy to production in this epic — CI only.",
    },
    "End-to-End Test Suite": {
      goal: "Comprehensive automated coverage of user journeys, failure modes, and load baselines.",
      scope:
        "20 E2E journeys, failure tests, load scripts, capacity documentation.",
      out: "Do not change production architecture — test and measure only.",
    },
    "MVP Deployment": {
      goal: "Deploy KinVue MVP to production within <= $300/month with smoke-tested Gateway, WS, and media.",
      scope:
        "Production Dockerfiles, infra provisioning, deploy, migrations, deployment runbook.",
      out: "Do not target 100k concurrent users — MVP scale only.",
    },
    "Documentation Refresh & Release": {
      goal: "Finalize docs, run acceptance checklist, and tag `v0.1.0-mvp` release.",
      scope: "README/plan updates, Phase 34 checklist, git tag.",
      out: "Do not start v2 features — documentation and release only.",
    },
  };

  let meta = null;
  for (const [k, v] of Object.entries(scopeMap)) {
    if (name.toLowerCase().includes(k.toLowerCase())) {
      meta = v;
      break;
    }
  }
  if (!meta) {
    meta = {
      goal: `Deliver ${name} capabilities for the KinVue MVP.`,
      scope: "See child issues listed below and `28_JIRA_BACKLOG.md`.",
      out: "Stay within this epic scope; defer out-of-scope features to later epics.",
    };
  }

  const orderLines = childSummaries.length
    ? childSummaries.map((c, i) => `${i + 1}. ${c}`)
    : ["1. See linked child issues in Jira backlog hierarchy"];

  return `## Goal\n${meta.goal}\n\n## Scope\n${meta.scope}\n\n## Out of scope\n${meta.out}\n\n## Suggested order\n${orderLines.join("\n")}\n\n## References\n- 28_JIRA_BACKLOG.md\n`;
}

function buildStoryDescription(issue) {
  const desc = issue.fields.description || "";
  const summary = issue.fields.summary;
  const labels = issue.fields.labels || [];
  const backlogKey = extractBacklogId(desc, summary);
  const item = backlogKey ? backlogItems.get(backlogKey) : null;

  const depends =
    item?.depends ??
    desc.match(/\*\*Depends On:\*\*\s*([^\n]+)/)?.[1]?.trim() ??
    desc.match(/## Depends On\s*\n+([^\n]+)/)?.[1]?.trim() ??
    "—";
  const sp =
    item?.sp ??
    desc.match(/\*\*Story Points:\*\*\s*(\d+)/)?.[1] ??
    desc.match(/## Story Points\s*\n+(\d+)/)?.[1] ??
    "?";

  const what = buildWhatToDo(item, summary, labels);
  const notes = buildTechnicalNotes(item, summary, backlogKey);
  const ac = extractAcceptanceCriteria(desc, backlogKey);

  return `## What to do\n${what}\n\n## Technical notes\n${notes.map((n) => `- ${n}`).join("\n")}\n\n## Story points\n${sp}\n\n## Depends on\n${depends}\n\n## Acceptance criteria\n${ac.join("\n")}\n\n## References\n- 28_JIRA_BACKLOG.md\n- 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md\n`;
}

const updates = [];
for (const issue of jiraIssues) {
  const type = issue.fields.issuetype.name;
  const summary = issue.fields.summary;
  let description;
  if (type === "Epic") {
    description = buildEpicDescription(
      summary,
      null,
      issue.fields.description || "",
    );
  } else {
    description = buildStoryDescription(issue);
  }
  updates.push({ key: issue.key, type, summary, description });
}

fs.writeFileSync(
  path.join(ROOT, "scripts/jira-description-updates.json"),
  JSON.stringify(updates, null, 2),
);
console.log("Generated", updates.length, "descriptions");
console.log("Epics:", updates.filter((u) => u.type === "Epic").length);
console.log(
  "Sample KIN-1 epic starts with:",
  updates.find((u) => u.key === "KIN-1").description.slice(0, 80),
);
console.log(
  "Sample KIN-38 starts with:",
  updates.find((u) => u.key === "KIN-38").description.slice(0, 80),
);
