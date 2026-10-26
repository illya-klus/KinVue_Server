// Helper to extract backlog refs from Jira search result JSON files
import fs from "fs";
import path from "path";

const dir =
  "C:/Users/klasi/.cursor/projects/d-projects-Kinvue-tickets/agent-tools";
const remaining = JSON.parse(
  fs.readFileSync("d:/projects/Kinvue_tickets/remaining_issues.json", "utf8"),
);

function extractBacklogRef(desc) {
  if (!desc) return null;
  const m = desc.match(/## Backlog Reference\s*\n\s*(KIN-\d+)/);
  if (m) return m[1];
  const m2 = desc.match(/\*\*Backlog ref:\*\*\s*(KIN-\d+)/i);
  if (m2) return m2[1];
  const m3 = desc.match(/\*\*Backlog ID:\*\*\s*BL-(\d+)/i);
  if (m3) return `BL-${m3[1]}`;
  return null;
}

const files = fs.readdirSync(dir).filter((f) => f.endsWith(".txt"));
const createdRefs = new Set();
const createdSummaries = new Set();

for (const f of files) {
  try {
    const data = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"));
    for (const issue of data.issues || []) {
      const ref = extractBacklogRef(issue.fields?.description);
      if (ref && ref.startsWith("KIN-")) createdRefs.add(ref);
      if (issue.fields?.summary)
        createdSummaries.add(issue.fields.summary.trim().toLowerCase());
    }
  } catch {}
}

const stillMissing = remaining.issues.filter(
  (i) =>
    !createdRefs.has(i.backlog_key) &&
    !createdSummaries.has(i.summary.trim().toLowerCase()),
);
console.log(
  JSON.stringify(
    {
      createdRefs: createdRefs.size,
      stillMissing: stillMissing.length,
      missingKeys: stillMissing.map((i) => i.backlog_key),
    },
    null,
    2,
  ),
);
