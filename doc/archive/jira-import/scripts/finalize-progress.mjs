import fs from "fs";
import path from "path";

const ROOT = path.resolve("d:/projects/Kinvue_tickets/scripts");
const progressFile = path.join(ROOT, "apply-progress.json");
const pending = JSON.parse(
  fs.readFileSync(path.join(ROOT, "pending-description-updates.json"), "utf8"),
);
const newlyApplied = JSON.parse(process.argv[2] || "[]");
const failed = JSON.parse(process.argv[3] || "[]");

const existing = JSON.parse(fs.readFileSync(progressFile, "utf8"));
const appliedSet = new Set([...(existing.applied || []), ...newlyApplied]);
const allKeys = [...appliedSet].sort(
  (a, b) => Number(a.split("-")[1]) - Number(b.split("-")[1]),
);
const totalPending = pending.length;
const appliedFromPending = pending.filter((p) => appliedSet.has(p.key)).length;

const out = {
  ...existing,
  applied: allKeys,
  descriptionUpdateStatus:
    appliedFromPending >= totalPending ? "complete" : "in_progress",
  appliedCount: allKeys.length,
  pendingCount: totalPending - appliedFromPending,
  failedKeys: failed,
  lastUpdated: new Date().toISOString(),
};

fs.writeFileSync(progressFile, JSON.stringify(out, null, 2) + "\n");
console.log(
  JSON.stringify(
    {
      appliedCount: out.appliedCount,
      status: out.descriptionUpdateStatus,
      pending: out.pendingCount,
      failed: failed.length,
    },
    null,
    2,
  ),
);
