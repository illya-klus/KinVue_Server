/**
 * Prints JSON lines for MCP editJiraIssue calls: { issueIdOrKey, description }
 * Usage: node apply-jira-batch-via-mcp.mjs 0
 */
import fs from "fs";
import path from "path";

const batchNum = Number(process.argv[2] ?? 0);
const batchPath = path.resolve(
  `d:/projects/Kinvue_tickets/scripts/batches/batch-${batchNum}.json`,
);
const batch = JSON.parse(fs.readFileSync(batchPath, "utf8"));
for (const item of batch) {
  process.stdout.write(
    JSON.stringify({ issueIdOrKey: item.key, description: item.description }) +
      "\n",
  );
}
