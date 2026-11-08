/**
 * KIN-133 — single entry for E2E (Phase 29.21). Runs KinVue_Client Playwright when present.
 */
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

const clientRoot = resolve(process.cwd(), "..", "KinVue_Client");
if (!existsSync(resolve(clientRoot, "package.json"))) {
  console.error("KinVue_Client not found next to KinVue_Server — skip or clone client repo.");
  process.exit(1);
}

const result = spawnSync("pnpm", ["test:e2e"], {
  cwd: clientRoot,
  stdio: "inherit",
  shell: true,
});
process.exit(result.status ?? 1);
