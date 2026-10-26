import fs from "fs";
import path from "path";

const ROOT = path.resolve("d:/projects/Kinvue_tickets/scripts");
const pending = JSON.parse(
  fs.readFileSync(path.join(ROOT, "pending-description-updates.json"), "utf8"),
);
const start = Number(process.argv[2] || 0);
const size = Number(process.argv[3] || 8);
const batch = pending.slice(start, start + size);
const out = path.join(ROOT, `mcp-batch-${start}.json`);
fs.writeFileSync(
  out,
  JSON.stringify(
    batch.map(({ key, description }) => ({ key, description })),
    null,
    2,
  ),
);
console.log(out, batch.map((x) => x.key).join(","));
