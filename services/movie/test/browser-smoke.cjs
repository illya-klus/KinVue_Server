/* Opt-in local verification. Auth/JWKS is a test fixture; Movie, Gateway, PostgreSQL and Meilisearch are real. */
const assert = require("node:assert/strict");
const { createServer } = require("node:http");
const { randomUUID } = require("node:crypto");
const { resolve } = require("node:path");
const { createRequire } = require("node:module");
const { Test } = require("@nestjs/testing");
const { ValidationPipe } = require("@nestjs/common");
const { ConfigModule } = require("@nestjs/config");
const { AppModule } = require("../dist/app.module");
const { MoviesRepository } = require("../dist/database/movies.repository");
const { DatabaseService } = require("../dist/database/database.service");
const {
  ProxyModule,
} = require("../../gateway/dist/modules/proxy/proxy.module");
const gatewayRequire = createRequire(
  resolve(__dirname, "../../gateway/package.json"),
);
const clientRequire = createRequire(
  resolve(__dirname, "../../../../KinVue_Client/package.json"),
);
const { chromium, expect } = clientRequire("@playwright/test");
const base = process.env.MOVIE_BROWSER_BASE_URL || "http://localhost:3000";

async function main() {
  const { generateKeyPair, exportJWK, SignJWT } = gatewayRequire("jose");
  const { privateKey, publicKey } = await generateKeyPair("RS256");
  const jwk = {
    ...(await exportJWK(publicKey)),
    kid: "sprint3-fixture",
    alg: "RS256",
    use: "sig",
  };
  const userId = randomUUID();
  const token = await new SignJWT({ scopes: ["admin"] })
    .setProtectedHeader({ alg: "RS256", kid: jwk.kid })
    .setSubject(userId)
    .setIssuer("sprint3-test")
    .setAudience("kinvue")
    .setExpirationTime("15m")
    .sign(privateKey);
  const auth = createServer((req, res) => {
    res.setHeader("content-type", "application/json");
    if (req.url === "/.well-known/jwks.json")
      return res.end(JSON.stringify({ keys: [jwk] }));
    if (req.url === "/auth/login") {
      res.setHeader(
        "set-cookie",
        "kinvue_refresh=fixture-session; HttpOnly; SameSite=Strict; Path=/auth/refresh",
      );
      return res.end(JSON.stringify({ accessToken: token }));
    }
    if (
      req.url === "/auth/refresh" &&
      req.headers.cookie?.includes("kinvue_refresh=fixture-session")
    )
      return res.end(JSON.stringify({ accessToken: token }));
    if (req.url === "/auth/refresh") {
      res.statusCode = 401;
      return res.end("{}");
    }
    if (req.url === "/auth/logout") {
      assert.ok(req.headers.cookie?.includes("kinvue_refresh=fixture-session"));
      res.setHeader(
        "set-cookie",
        "kinvue_refresh=; HttpOnly; SameSite=Strict; Path=/auth/refresh; Max-Age=0",
      );
      res.statusCode = 204;
      return res.end();
    }
    if (req.url?.startsWith("/notifications"))
      return res.end(JSON.stringify({ items: [] }));
    res.statusCode = 404;
    res.end("{}");
  });
  let movie, gateway, browser;
  try {
    await new Promise((resolve) => auth.listen(4010, "127.0.0.1", resolve));
    const movieModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    movie = movieModule.createNestApplication({ logger: false });
    movie.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );
    await movie.listen(4003, "127.0.0.1");
    const gatewayModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          ignoreEnvFile: true,
          load: [
            () => ({
              AUTH_SERVICE_URL: "http://127.0.0.1:4010",
              MOVIE_SERVICE_URL: "http://127.0.0.1:4003",
              NOTIFICATION_SERVICE_URL: "http://127.0.0.1:4010",
              JWT_ISSUER: "sprint3-test",
              JWT_AUDIENCE: "kinvue",
            }),
          ],
        }),
        ProxyModule,
      ],
    }).compile();
    gateway = gatewayModule.createNestApplication({ logger: false });
    gateway.enableCors({ origin: base, credentials: true });
    await gateway.listen(4000, "127.0.0.1");
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    const failures = [];
    page.on("pageerror", (error) => failures.push(error.message));
    page.setDefaultTimeout(20000);
    page.setDefaultNavigationTimeout(60000);
    await page.goto(base + "/login");
    await page.getByLabel("Email").fill("sprint3@example.test");
    await page.getByLabel("Password").fill("fixture-passphrase");
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await expect(page).toHaveURL(/movies\/search/, { timeout: 20000 });
    const cookie = (await page.context().cookies()).find(
      (c) => c.name === "kinvue_refresh",
    );
    assert.equal(cookie?.httpOnly, true);
    assert.equal(cookie?.path, "/api/auth");
    await page.goto(base + "/admin/movies");
    const title = "Sprint Three " + randomUUID().slice(0, 8);
    await page.getByLabel("Title", { exact: true }).fill(title);
    await page.getByLabel("Description").fill("Catalog browser integration");
    await page.getByLabel("Genres").fill("Adventure");
    await page.getByRole("button", { name: "Create draft" }).click();
    await expect(page.getByText("Draft created")).toBeVisible();
    const editLink = await page
      .getByRole("link", { name: "Edit permalink" })
      .getAttribute("href");
    const id = editLink.split("/")[3];
    const repo = movieModule.get(MoviesRepository);
    const db = movieModule.get(DatabaseService);
    assert.equal((await repo.findById(id)).created_by_user_id, userId);
    await page.getByRole("link", { name: "Edit permalink" }).click();
    await expect(page.getByLabel("Title", { exact: true })).toHaveValue(title);
    await page.getByLabel("Description").fill("Edited through Gateway");
    await page.getByRole("button", { name: "Save movie" }).click();
    await expect(page.getByText("Movie saved", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Publish now" }).click();
    await expect(page.getByText(/Publication requires READY/)).toBeVisible();
    // Media processing belongs to Sprint 5; prepare READY through the repository for this catalog test.
    await repo.setMediaUploading(id);
    await repo.setMediaProcessing(id, "fixture/original");
    await repo.markMediaReady(id, "fixture/master");
    await page.getByRole("button", { name: "Publish now" }).click();
    await expect(
      page.getByText("Catalog saved. Search indexing queued."),
    ).toBeVisible();
    await page.goto(base + "/movies/search");
    await page.getByPlaceholder("Search (min 2 chars)…").fill(title);
    await expect(page.getByRole("link", { name: title })).toBeVisible();
    await page.getByRole("link", { name: title }).click();
    await expect(page).toHaveURL(new RegExp("/movies/" + id + "$"));
    await expect(
      page.getByRole("heading", { name: title, exact: true }),
    ).toBeVisible();
    await expect(page.getByText("Edited through Gateway")).toBeVisible();
    await page.getByRole("button", { name: "Add to watchlist" }).click();
    await expect(
      page.getByRole("button", { name: "Remove from watchlist" }),
    ).toBeVisible();
    assert.equal((await repo.listWatchlist(userId))[0].movieId, id);
    await page.goto(base + "/watchlist");
    await expect(page.getByRole("link", { name: title })).toBeVisible();
    await page.getByRole("button", { name: "Remove", exact: true }).click();
    await expect(page.getByText("Watchlist is empty")).toBeVisible();
    assert.equal((await repo.listWatchlist(userId)).length, 0);
    const spoof = await fetch("http://127.0.0.1:4000/api/admin/movies/" + id, {
      headers: { "x-user-id": userId, "x-user-scopes": "admin" },
    });
    assert.equal(spoof.status, 401);
    assert.deepEqual(failures, []);
    await page.getByRole("button", { name: "Log out", exact: true }).click();
    await expect
      .poll(async () =>
        (await page.context().cookies()).some(
          (c) => c.name === "kinvue_refresh",
        ),
      )
      .toBe(false);
    console.log(
      "PASS browser -> Gateway (RS256/JWKS fixture) -> Movie -> PostgreSQL 16 -> Meilisearch -> browser",
    );
    await db.query("DELETE FROM movies WHERE movie_id=$1", [id]);
  } finally {
    await browser?.close();
    await gateway?.close();
    await movie?.close();
    await new Promise((resolve) => auth.close(resolve));
  }
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
