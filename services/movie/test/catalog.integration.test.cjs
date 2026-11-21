const { test } = require("node:test");
const assert = require("node:assert/strict");
const { spawnSync } = require("node:child_process");
const { randomUUID } = require("node:crypto");
const { resolve } = require("node:path");
const { setTimeout: delay } = require("node:timers/promises");
const { Client } = require("pg");
const { Test } = require("@nestjs/testing");
const { ValidationPipe } = require("@nestjs/common");
const { ConfigService } = require("@nestjs/config");
const request = require("supertest");
const root = resolve(__dirname, "..");
const { DatabaseService } = require("../dist/database/database.service");
const { MoviesRepository } = require("../dist/database/movies.repository");
const {
  SyncStateRepository,
} = require("../dist/database/sync-state.repository");
const { CatalogService } = require("../dist/modules/catalog/catalog.service");
const {
  AdminCatalogController,
  PublicCatalogController,
} = require("../dist/modules/catalog/catalog.controller");
const {
  MovieSearchIndexService,
} = require("../dist/modules/search/movie-search-index.service");
const docker = (args) =>
  spawnSync("docker", args, { encoding: "utf8", windowsHide: true });
test(
  "Movie migrations and catalog API with real PostgreSQL 16",
  { timeout: 180000 },
  async () => {
    const name = "kinvue-movie-test-" + randomUUID().slice(0, 8);
    const password = randomUUID();
    const port = Number(process.env.MOVIE_TEST_PORT || 55434);
    const url = `postgresql://kinvue_movie:${password}@127.0.0.1:${port}/kinvue_movie`;
    const start = docker([
      "run",
      "-d",
      "--rm",
      "--name",
      name,
      "-e",
      "POSTGRES_USER=kinvue_movie",
      "-e",
      `POSTGRES_PASSWORD=${password}`,
      "-e",
      "POSTGRES_DB=kinvue_movie",
      "-p",
      `127.0.0.1:${port}:5432`,
      "postgres:16-alpine",
    ]);
    assert.equal(start.status, 0, start.stderr);
    let client, app;
    try {
      for (let attempt = 0; attempt < 60; attempt++) {
        client = new Client({
          connectionString: url,
          connectionTimeoutMillis: 1000,
        });
        try {
          await client.connect();
          break;
        } catch {
          await client.end().catch(() => {});
          client = undefined;
          await delay(500);
        }
      }
      assert.ok(client, "PostgreSQL did not start");
      for (let run = 0; run < 2; run++) {
        const result = spawnSync(
          process.execPath,
          ["scripts/migrate-movie.mjs"],
          {
            cwd: root,
            env: {
              ...process.env,
              MOVIE_DATABASE_URL: url,
              DATABASE_URL: undefined,
            },
            encoding: "utf8",
            windowsHide: true,
          },
        );
        assert.equal(
          result.status,
          0,
          (result.stderr + result.stdout).replaceAll(password, "[redacted]"),
        );
        assert.match(
          result.stdout,
          new RegExp('"migrationsApplied":' + (run === 0 ? 2 : 0)),
        );
      }
      const tables = (
        await client.query(
          "SELECT table_name FROM information_schema.tables WHERE table_schema='public'",
        )
      ).rows.map((r) => r.table_name);
      for (const name of [
        "movies",
        "movie_uploads",
        "watchlist_items",
        "movie_index_sync_state",
        "movie_outbox_events",
      ])
        assert.ok(tables.includes(name), name);
      assert.ok(
        !tables.includes("auth_identities"),
        "Auth schema must not leak into Movie",
      );
      const indexes = (
        await client.query("SELECT id FROM movie_index_sync_state")
      ).rows;
      assert.deepEqual(indexes, [{ id: "movies" }]);
      const outboxColumns = (
        await client.query(
          "SELECT column_name FROM information_schema.columns WHERE table_name='movie_outbox_events'",
        )
      ).rows.map((row) => row.column_name);
      for (const column of [
        "event_id",
        "type",
        "payload",
        "status",
        "created_at",
        "published_at",
        "retry_count",
      ])
        assert.ok(outboxColumns.includes(column), column);
      const indexNames = (
        await client.query(
          "SELECT indexname FROM pg_indexes WHERE schemaname='public'",
        )
      ).rows.map((r) => r.indexname);
      for (const name of [
        "movies_publication_status_idx",
        "movies_publish_at_idx",
        "movies_updated_at_idx",
        "watchlist_items_user_id_idx",
        "movie_uploads_movie_id_idx",
      ])
        assert.ok(indexNames.includes(name), name);
      const cols = (
        await client.query(
          "SELECT column_name FROM information_schema.columns WHERE table_name='movie_uploads'",
        )
      ).rows.map((r) => r.column_name);
      for (const name of [
        "upload_id",
        "movie_id",
        "s3_upload_id",
        "object_key",
        "part_count",
        "status",
        "expires_at",
        "completed_at",
      ])
        assert.ok(cols.includes(name), name);
      const user = randomUUID(),
        other = randomUUID();
      let failIndex = true,
        indexed = 0;
      const module = await Test.createTestingModule({
        controllers: [AdminCatalogController, PublicCatalogController],
        providers: [
          DatabaseService,
          MoviesRepository,
          SyncStateRepository,
          CatalogService,
          { provide: ConfigService, useValue: { getOrThrow: () => url } },
          {
            provide: MovieSearchIndexService,
            useValue: {
              upsertPublishedMovie: async (movie) => {
                const row = (
                  await client.query(
                    "SELECT publication_status FROM movies WHERE movie_id=$1",
                    [movie.id],
                  )
                ).rows[0];
                assert.equal(
                  row.publication_status,
                  "PUBLISHED",
                  "PostgreSQL must commit before index call",
                );
                indexed++;
                if (failIndex) throw new Error("index offline");
              },
            },
          },
        ],
      }).compile();
      app = module.createNestApplication();
      app.useGlobalPipes(
        new ValidationPipe({
          transform: true,
          whitelist: true,
          forbidNonWhitelisted: true,
        }),
      );
      await app.init();
      const api = request(app.getHttpServer());
      const admin = (req) =>
        req.set("x-user-id", user).set("x-user-scopes", "admin");
      const metadata = {
        title: "Interstellar",
        description: "Space voyage",
        genres: ["Sci-Fi"],
      };
      await api.post("/admin/movies").send(metadata).expect(403);
      await admin(api.post("/admin/movies"))
        .send({ ...metadata, title: " " })
        .expect(400);
      assert.equal(
        (await client.query("SELECT count(*) FROM movies")).rows[0].count,
        "0",
      );
      const draft = (
        await admin(api.post("/admin/movies")).send(metadata).expect(201)
      ).body;
      const id = draft.movieId;
      assert.equal(draft.publicationStatus, "DRAFT");
      assert.equal(draft.mediaStatus, "NONE");
      assert.equal(
        (await client.query("SELECT created_by_user_id FROM movies")).rows[0]
          .created_by_user_id,
        user,
      );
      await api.get("/movies/" + id).expect(404);
      await api
        .post("/movies/" + id + "/watchlist")
        .set("x-user-id", user)
        .send({ userId: other })
        .expect(404);
      await api.get("/admin/movies/" + id).expect(403);
      assert.equal(
        (await admin(api.get("/admin/movies/" + id)).expect(200)).body.title,
        metadata.title,
      );
      await admin(api.patch("/admin/movies/" + id))
        .send({ movieId: randomUUID() })
        .expect(400);
      await admin(api.patch("/admin/movies/" + randomUUID()))
        .send({ title: "Missing" })
        .expect(404);
      await admin(api.post("/admin/movies/" + id + "/publish")).expect(409);
      await admin(api.post("/admin/movies/" + id + "/schedule"))
        .send({ publishAt: new Date(0).toISOString() })
        .expect(400);
      const repo = module.get(MoviesRepository);
      await repo.setMediaUploading(id);
      await repo.setMediaProcessing(id, "private/original");
      await repo.markMediaReady(id, "private/master.m3u8");
      const published = (
        await admin(api.post("/admin/movies/" + id + "/publish")).expect(200)
      ).body;
      assert.equal(published.catalogSaved, true);
      assert.equal(published.searchIndex, "PENDING");
      const publicMovie = (await api.get("/movies/" + id).expect(200)).body;
      assert.ok(!JSON.stringify(publicMovie).includes("private/"));
      for (let i = 0; i < 2; i++)
        await api
          .post("/movies/" + id + "/watchlist")
          .set("x-user-id", user)
          .send({ userId: other })
          .expect(200);
      assert.equal(
        (await client.query("SELECT count(*) FROM watchlist_items")).rows[0]
          .count,
        "1",
      );
      await api.get("/watchlist").expect(401);
      assert.deepEqual(
        (await api.get("/watchlist").set("x-user-id", other).expect(200)).body,
        [],
      );
      await admin(api.patch("/admin/movies/" + id))
        .send({ title: "Updated title", posterKey: "posters/current.jpg" })
        .expect(200);
      const list = (
        await api.get("/watchlist").set("x-user-id", user).expect(200)
      ).body;
      assert.equal(list[0].title, "Updated title");
      assert.equal(list[0].posterKey, "posters/current.jpg");
      await api
        .delete("/movies/" + id + "/watchlist")
        .set("x-user-id", other)
        .expect(204);
      assert.equal((await repo.listWatchlist(user)).length, 1);
      for (let i = 0; i < 2; i++)
        await api
          .delete("/movies/" + id + "/watchlist")
          .set("x-user-id", user)
          .expect(204);
      assert.equal((await repo.listWatchlist(user)).length, 0);
      failIndex = false;
      assert.equal(
        (await admin(api.post("/admin/movies/" + id + "/publish")).expect(200))
          .body.searchIndex,
        "QUEUED",
      );
      await admin(api.post("/admin/movies/" + id + "/schedule"))
        .send({ publishAt: new Date(Date.now() + 60000).toISOString() })
        .expect(409);
      const due = await repo.create(metadata, user),
        future = await repo.create(metadata, user),
        notReady = await repo.create(metadata, user);
      for (const movie of [due, future]) {
        await repo.setMediaUploading(movie.id);
        await repo.setMediaProcessing(movie.id, "original");
        await repo.markMediaReady(movie.id, "master");
      }
      for (const movie of [due, future, notReady])
        await admin(api.post("/admin/movies/" + movie.id + "/schedule"))
          .send({ publishAt: new Date(Date.now() + 3600000).toISOString() })
          .expect(200);
      await client.query(
        "UPDATE movies SET publish_at=NOW()-INTERVAL '1 minute' WHERE movie_id=ANY($1::uuid[])",
        [[due.id, notReady.id]],
      );
      const service = module.get(CatalogService);
      await Promise.all([service.publishDue(), service.publishDue()]);
      await service.publishDue();
      assert.equal((await repo.findById(due.id)).status, "PUBLISHED");
      assert.equal((await repo.findById(future.id)).status, "SCHEDULED");
      assert.equal((await repo.findById(notReady.id)).status, "SCHEDULED");
      await assert.rejects(
        client.query(
          "UPDATE movies SET publication_status='INVALID' WHERE movie_id=$1",
          [id],
        ),
        (e) => e.code === "23514",
      );
      await assert.rejects(
        client.query("UPDATE movies SET genres='{}' WHERE movie_id=$1", [id]),
        (e) => e.code === "23514",
      );
      const sync = module.get(SyncStateRepository);
      await sync.getLastSuccessfulSync();
      await sync.setLastSuccessfulSync(new Date());
      assert.equal(
        (await client.query("SELECT id FROM movie_index_sync_state")).rows[0]
          .id,
        "movies",
      );
      assert.ok(indexed >= 3);
    } finally {
      await app?.close();
      await client?.end();
      docker(["stop", name]);
    }
  },
);
