/**
 * KIN-167 — Gateway must not own durable business state (Step 30.2).
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("Gateway stateless boundary", () => {
  it("does not import a session or room state store", () => {
    const appModule = readFileSync(
      resolve(__dirname, "../../app.module.ts"),
      "utf8",
    );
    expect(appModule).not.toMatch(
      /TypeOrmModule|mongoose|MongooseModule|sessionStore/,
    );
  });
});
