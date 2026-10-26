/**
 * Reads issue-desc/*.md and jira-description-updates.json,
 * prints progress file for tracking which keys were applied.
 * Actual Jira updates must go through MCP editJiraIssue.
 */
import fs from "fs";
import path from "path";

const ROOT = path.resolve("d:/projects/Kinvue_tickets/scripts");
const descDir = path.join(ROOT, "issue-desc");
const progressFile = path.join(ROOT, "apply-progress.json");
const skip = new Set([
  "KIN-1",
  "KIN-2",
  "KIN-3",
  "KIN-4",
  "KIN-5",
  "KIN-6",
  "KIN-7",
  "KIN-8",
  "KIN-9",
  "KIN-10",
]);

let progress = { applied: [] };
if (fs.existsSync(progressFile))
  progress = JSON.parse(fs.readFileSync(progressFile, "utf8"));

const appliedSet = new Set(progress.applied);
const files = fs
  .readdirSync(descDir)
  .filter((f) => f.endsWith(".md"))
  .sort((a, b) => {
    const na = Number(a.match(/KIN-(\d+)/)[1]);
    const nb = Number(b.match(/KIN-(\d+)/)[1]);
    return na - nb;
  });

const pending = files
  .map((f) => f.replace(".md", ""))
  .filter((k) => !skip.has(k) && !appliedSet.has(k));

console.log(
  JSON.stringify(
    {
      totalFiles: files.length,
      applied: appliedSet.size,
      pending: pending.length,
      nextBatch: pending.slice(0, 20),
    },
    null,
    2,
  ),
);
