const { test } = require("node:test");
const assert = require("node:assert/strict");
const { randomUUID } = require("node:crypto");
const { spawnSync } = require("node:child_process");
const { resolve } = require("node:path");
const { setTimeout: delay } = require("node:timers/promises");
const { ConfigService } = require("@nestjs/config");
const { Test } = require("@nestjs/testing");
const request = require("supertest");
const amqp = require("amqplib");
const {
  S3Client,
  CreateBucketCommand,
  PutObjectCommand,
  ListMultipartUploadsCommand,
  PutBucketLifecycleConfigurationCommand,
} = require("@aws-sdk/client-s3");
const { DatabaseService } = require("../dist/database/database.service");
const { MoviesRepository } = require("../dist/database/movies.repository");
const {
  UploadsRepository,
} = require("../dist/modules/uploads/uploads.repository");
const {
  S3MultipartService,
} = require("../dist/modules/uploads/s3-multipart.service");
const {
  MovieUploadService,
} = require("../dist/modules/uploads/movie-upload.service");
const {
  UploadMaintenanceWorker,
} = require("../dist/modules/uploads/upload-maintenance.worker");
const {
  MediaTranscodePublisher,
} = require("../dist/modules/uploads/media-transcode.publisher");
const {
  MediaAccessService,
  MediaAccessController,
} = require("../dist/modules/uploads/media-access.service");
const docker = (args) =>
  spawnSync("docker", args, { encoding: "utf8", windowsHide: true });

test(
  "private S3 multipart, durable enqueue, cleanup and signed HLS graph",
  { timeout: 240000 },
  async () => {
    const suffix = randomUUID().slice(0, 8),
      password = randomUUID(),
      names = [];
    let db, app, publisher, connection, browser, browserPage, browserOrigin;
    const url = `postgresql://kinvue_movie:${password}@127.0.0.1:55435/kinvue_movie`;
    const endpoint = "http://127.0.0.1:59000";
    const config = new ConfigService({
      MOVIE_DATABASE_URL: url,
      S3_ENDPOINT: endpoint,
      S3_BUCKET: "kinvue-media",
      S3_ACCESS_KEY: "kinvue-test",
      S3_SECRET_KEY: password,
      RABBITMQ_URL: `amqp://kinvue:${password}@127.0.0.1:55672`,
    });
    const start = (label, image, args, command = []) => {
      const name = `kinvue-s5-${label}-${suffix}`;
      const result = docker([
        "run",
        "-d",
        "--rm",
        "--name",
        name,
        ...args,
        image,
        ...command,
      ]);
      assert.equal(result.status, 0, result.stderr);
      names.push(name);
    };
    try {
      start("pg", "postgres:16-alpine", [
        "-e",
        "POSTGRES_USER=kinvue_movie",
        "-e",
        `POSTGRES_PASSWORD=${password}`,
        "-e",
        "POSTGRES_DB=kinvue_movie",
        "-p",
        "127.0.0.1:55435:5432",
      ]);
      start(
        "s3",
        process.env.MEDIA_TEST_MINIO_IMAGE ||
          "pgsty/minio:RELEASE.2026-08-04T00-00-00Z",
        [
          "-e",
          "MINIO_API_CORS_ALLOW_ORIGIN=http://localhost:3000,http://127.0.0.1:3009",
          "-e",
          "MINIO_ROOT_USER=kinvue-test",
          "-e",
          `MINIO_ROOT_PASSWORD=${password}`,
          "-p",
          "127.0.0.1:59000:9000",
        ],
        ["server", "/data"],
      );
      start("mq", "rabbitmq:3-management-alpine", [
        "-e",
        "RABBITMQ_DEFAULT_USER=kinvue",
        "-e",
        `RABBITMQ_DEFAULT_PASS=${password}`,
        "-p",
        "127.0.0.1:55672:5672",
      ]);
      db = new DatabaseService(config);
      await db.onModuleInit();
      for (let i = 0; ; i++) {
        try {
          await db.query("SELECT 1");
          break;
        } catch {
          if (i > 90) throw Error("Postgres unavailable");
          await delay(500);
        }
      }
      const migrated = spawnSync(
        process.execPath,
        ["scripts/migrate-movie.mjs"],
        {
          cwd: resolve(__dirname, ".."),
          env: { ...process.env, MOVIE_DATABASE_URL: url },
          encoding: "utf8",
          windowsHide: true,
        },
      );
      assert.equal(
        migrated.status,
        0,
        (migrated.stderr + migrated.stdout).replaceAll(password, "[redacted]"),
      );
      for (let i = 0; ; i++) {
        try {
          if ((await fetch(endpoint + "/minio/health/live")).ok) break;
        } catch {}
        if (i > 90) throw Error("MinIO unavailable");
        await delay(500);
      }
      const s3client = new S3Client({
        endpoint,
        region: "us-east-1",
        forcePathStyle: true,
        credentials: { accessKeyId: "kinvue-test", secretAccessKey: password },
      });
      await s3client.send(new CreateBucketCommand({ Bucket: "kinvue-media" }));
      await s3client.send(
        new PutBucketLifecycleConfigurationCommand({
          Bucket: "kinvue-media",
          LifecycleConfiguration: {
            Rules: [
              {
                ID: "expire-access-manifests",
                Status: "Enabled",
                Filter: { Prefix: "_access/" },
                Expiration: { Days: 1 },
              },
            ],
          },
        }),
      );
      if (process.env.MEDIA_BROWSER_VERIFY === "1") {
        const { chromium } = require(
          resolve(
            __dirname,
            "../../../../KinVue_Client/node_modules/@playwright/test",
          ),
        );
        browser = await chromium.launch({ headless: true });
        browserPage = await browser.newPage();
        browserOrigin = require("node:http").createServer((_req, res) => {
          res.setHeader("Content-Type", "text/html");
          res.end("<html>KinVue storage CORS test</html>");
        });
        await new Promise((resolve) =>
          browserOrigin.listen(3009, "127.0.0.1", resolve),
        );
        await browserPage.goto("http://127.0.0.1:3009/");
      }
      const movies = new MoviesRepository(db),
        uploads = new UploadsRepository(db),
        s3 = new S3MultipartService(config);
      const service = new MovieUploadService(movies, uploads, s3);
      const create = () =>
        movies.create(
          { title: "Media test", description: "test", genres: [] },
          randomUUID(),
        );
      const movie = await create();
      const body = {
        fileName: "../clip.mp4",
        contentType: "video/mp4",
        fileSizeBytes: 9_000_000,
        partCount: 2,
      };
      for (const patch of [
        { fileSizeBytes: 1_000_000 },
        { fileSizeBytes: 25_000_000_001 },
        { contentType: "text/plain" },
        { partCount: 10001 },
      ])
        await assert.rejects(
          service.initUpload(movie.id, { ...body, ...patch }),
        );
      await assert.rejects(service.initUpload(randomUUID(), body));
      const attempts = await Promise.allSettled([
        service.initUpload(movie.id, body),
        service.initUpload(movie.id, body),
      ]);
      assert.equal(
        attempts.filter((x) => x.status === "fulfilled").length,
        1,
        "only one concurrent upload can claim movie",
      );
      const init = attempts.find((x) => x.status === "fulfilled").value;
      const row = await uploads.findInitiatedById(init.uploadId, movie.id);
      assert.equal(
        row.object_key,
        `movies/${movie.id}/original/${init.uploadId}/clip.mp4`,
      );
      assert.equal(init.parts.length, 2);
      assert.equal((await movies.findById(movie.id)).media_status, "UPLOADING");
      const parts = [];
      for (const part of init.parts) {
        assert.equal(new URL(part.url).origin, endpoint);
        const put = await fetch(part.url, {
          method: "PUT",
          body: Buffer.alloc(
            part.partNumber === 1 ? 8 * 1024 * 1024 : 611392,
            part.partNumber,
          ),
        });
        assert.equal(put.status, 200);
        parts.push({
          partNumber: part.partNumber,
          etag: put.headers.get("etag"),
        });
      }
      await assert.rejects(
        service.completeUpload(movie.id, {
          uploadId: init.uploadId,
          parts: [parts[0]],
        }),
      );
      await assert.rejects(
        service.completeUpload(movie.id, {
          uploadId: init.uploadId,
          parts: [{ ...parts[0], etag: "" }, parts[1]],
        }),
      );
      assert.equal((await movies.findById(movie.id)).media_status, "UPLOADING");
      const realEnqueue = uploads.enqueue.bind(uploads);
      uploads.enqueue = async () => {
        throw new Error("Injected DB failure after S3 complete");
      };
      await assert.rejects(
        service.completeUpload(movie.id, { uploadId: init.uploadId, parts }),
      );
      assert.equal((await movies.findById(movie.id)).media_status, "UPLOADING");
      uploads.enqueue = realEnqueue;
      // Queue is deliberately unavailable to Movie during completion: the DB job survives.
      await service.completeUpload(movie.id, {
        uploadId: init.uploadId,
        parts,
      });
      await service.completeUpload(movie.id, {
        uploadId: init.uploadId,
        parts,
      }); // lost-response retry is idempotent
      assert.equal(
        (await movies.findById(movie.id)).media_status,
        "PROCESSING",
      );
      assert.equal((await uploads.pending()).length, 1);
      for (let i = 0; ; i++) {
        try {
          connection = await amqp.connect(config.get("RABBITMQ_URL"));
          break;
        } catch {
          if (i > 90) throw Error("RabbitMQ unavailable");
          await delay(500);
        }
      }
      publisher = new MediaTranscodePublisher(config);
      const worker = new UploadMaintenanceWorker(uploads, s3, publisher);
      await worker.tick();
      assert.equal((await uploads.pending()).length, 0);
      const channel = await connection.createChannel();
      const message = await channel.get("media.transcode", { noAck: true });
      const job = JSON.parse(message.content.toString());
      assert.equal(job.movieId, movie.id);
      assert.equal(job.originalKey, row.object_key);
      assert.equal(job.attempt, 1);
      assert.ok(job.jobId);
      await worker.tick();
      assert.equal(
        await channel.get("media.transcode", { noAck: true }),
        false,
      );

      const stale = await create(),
        young = await create();
      const staleInit = await service.initUpload(stale.id, {
        ...body,
        partCount: 1,
      });
      const youngInit = await service.initUpload(young.id, {
        ...body,
        partCount: 1,
      });
      await db.query(
        "UPDATE movie_uploads SET created_at = NOW() - INTERVAL '25 hours' WHERE upload_id=$1",
        [staleInit.uploadId],
      );
      await worker.tick();
      assert.equal((await movies.findById(stale.id)).media_status, "ABANDONED");
      assert.equal((await movies.findById(young.id)).media_status, "UPLOADING");
      const remaining = await s3client.send(
        new ListMultipartUploadsCommand({ Bucket: "kinvue-media" }),
      );
      assert.ok(
        !(remaining.Uploads ?? []).some((u) =>
          u.Key.includes(staleInit.uploadId),
        ),
      );
      assert.ok(
        (remaining.Uploads ?? []).some((u) =>
          u.Key.includes(youngInit.uploadId),
        ),
      );
      assert.equal(
        (await service.refreshParts(young.id, youngInit.uploadId)).parts.length,
        1,
      );
      await assert.rejects(service.refreshParts(stale.id, staleInit.uploadId));
      await service.initUpload(stale.id, { ...body, partCount: 1 }); // accepted ABANDONED -> UPLOADING

      const prefix = `movies/${movie.id}/hls/`;
      for (const [key, Body] of [
        [
          "master.m3u8",
          "#EXTM3U\n#EXT-X-STREAM-INF:BANDWIDTH=1500000\n480/index.m3u8\n",
        ],
        [
          "480/index.m3u8",
          "#EXTM3U\n#EXT-X-TARGETDURATION:4\n#EXTINF:4,\nsegment.ts\n#EXT-X-ENDLIST\n",
        ],
        ["480/segment.ts", "private-segment-fixture"],
      ])
        await s3client.send(
          new PutObjectCommand({
            Bucket: "kinvue-media",
            Key: prefix + key,
            Body,
          }),
        );
      const media = new MediaAccessService(config, movies);
      await assert.rejects(media.access(movie.id));
      await movies.markMediaReady(movie.id, prefix + "master.m3u8");
      await assert.rejects(
        media.access(movie.id),
        "READY draft must remain private",
      );
      await movies.publish(movie.id);
      const module = await Test.createTestingModule({
        controllers: [MediaAccessController],
        providers: [{ provide: MediaAccessService, useValue: media }],
      }).compile();
      app = module.createNestApplication();
      await app.init();
      await request(app.getHttpServer())
        .post(`/movies/${movie.id}/media-access`)
        .expect(401);
      const access = (
        await request(app.getHttpServer())
          .post(`/movies/${movie.id}/media-access`)
          .set("x-user-id", randomUUID())
          .expect(200)
      ).body;
      assert.ok(Date.parse(access.expiresAt) - Date.now() <= 600000);
      const master = await fetch(access.url);
      assert.equal(master.status, 200);
      const masterBody = await master.text();
      assert.match(masterBody, /X-Amz-Signature=/);
      const variantUrl = masterBody
        .split("\n")
        .find((l) => l.startsWith("http"));
      const variant = await fetch(variantUrl);
      assert.equal(variant.status, 200);
      const variantBody = await variant.text();
      const segmentUrl = variantBody
        .split("\n")
        .find((l) => l.startsWith("http"));
      assert.equal(
        await (await fetch(segmentUrl)).text(),
        "private-segment-fixture",
      );
      if (browserPage) {
        const result = await browserPage.evaluate(async (url) => {
          const r = await fetch(url);
          return { status: r.status, body: await r.text() };
        }, segmentUrl);
        assert.deepEqual(result, {
          status: 200,
          body: "private-segment-fixture",
        });
        const refreshed = await service.refreshParts(
          young.id,
          youngInit.uploadId,
        );
        const put = await browserPage.evaluate(async (url) => {
          const r = await fetch(url, {
            method: "PUT",
            body: new Uint8Array(1_000_001),
          });
          return { status: r.status, etag: r.headers.get("etag") };
        }, refreshed.parts[0].url);
        assert.equal(put.status, 200);
        assert.ok(put.etag, "ETag must be exposed by real MinIO CORS");
      }
      for (const signed of [access.url, variantUrl, segmentUrl]) {
        const parsed = new URL(signed);
        assert.equal(parsed.origin, endpoint);
        assert.equal(parsed.searchParams.get("X-Amz-Expires"), "600");
        assert.equal(
          (await fetch(parsed.origin + parsed.pathname)).status,
          403,
          "unsigned bucket access denied",
        );
        parsed.searchParams.set("X-Amz-Date", "20000101T000000Z");
        assert.equal(
          (await fetch(parsed)).status,
          403,
          "expired/tampered URL denied",
        );
      }
      await s3client.send(
        new PutObjectCommand({
          Bucket: "kinvue-media",
          Key: prefix + "master.m3u8",
          Body: "#EXTM3U\n../../other/secret.ts\n",
        }),
      );
      await assert.rejects(media.access(movie.id), /outside movie/);
      await channel.close();
      s3client.destroy();
    } finally {
      await browser?.close();
      if (browserOrigin)
        await new Promise((resolve) => browserOrigin.close(resolve));
      await app?.close();
      await publisher?.onApplicationShutdown();
      await connection?.close();
      await db?.onModuleDestroy();
      for (const name of names.reverse()) docker(["stop", name]);
    }
  },
);
