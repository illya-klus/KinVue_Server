/**
 * Apply all pending Jira description updates using markdown contentFormat.
 * Run via MCP editJiraIssue in batches - this script prints batch slices for automation.
 */
import fs from "fs";
import path from "path";

const ROOT = path.resolve("d:/projects/Kinvue_tickets/scripts");
const pending = JSON.parse(
  fs.readFileSync(path.join(ROOT, "pending-description-updates.json"), "utf8"),
);
const start = Number(process.env.START || 0);
const size = Number(process.env.SIZE || 8);
const batch = pending.slice(start, start + size);
const out = path.join(ROOT, `_batch-${start}.json`);
fs.writeFileSync(out, JSON.stringify(batch, null, 2));
console.log(
  JSON.stringify({ start, size, keys: batch.map((x) => x.key), out }),
);
