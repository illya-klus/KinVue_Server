import fs from "fs";

const content = fs.readFileSync(
  "d:/projects/Kinvue_tickets/28_JIRA_BACKLOG.md",
  "utf8",
);

const skipBacklogKeys = new Set([
  "KIN-1", // toolchain - skip per instructions
  "KIN-2",
  "KIN-3",
  "KIN-4",
  "KIN-5",
  "KIN-11",
  "KIN-12",
  "KIN-13",
  "KIN-14",
  "KIN-15",
  "KIN-16", // sprint 0 pre-created
]);

function norm(s) {
  return (s || "").toLowerCase().replace(/`/g, "").replace(/\s+/g, " ").trim();
}

// Parse expected backlog child issues
const expected = [];
for (const line of content.split(/\r?\n/)) {
  const trimmed = line.trim();
  if (!trimmed.startsWith("| KIN-") || trimmed.includes("-----")) continue;
  const parts = trimmed
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((p) => p.trim());
  if (parts.length < 6) continue;
  const [key, , summary] = parts;
  if (skipBacklogKeys.has(key)) continue;
  expected.push({ key, summary: norm(summary) });
}

// Load Jira exports (3 pages saved manually - we'll parse from agent-tools or use inline)
const pageFiles = [
  "C:/Users/klasi/.cursor/projects/d-projects-Kinvue-tickets/agent-tools/68e5f711-6c08-4f84-b628-b0cde3acb9d0.txt",
  "C:/Users/klasi/.cursor/projects/d-projects-Kinvue-tickets/agent-tools/82288109-1621-4d13-a053-542a50f25ac8.txt",
];

// Page 3 inline in conversation - save minimal extraction via regex on all files
const jiraBacklogRefs = new Set();
const jiraSummaries = new Set();

function processIssues(json) {
  for (const issue of json.issues || []) {
    jiraSummaries.add(norm(issue.fields.summary));
    const desc = issue.fields.description || "";
    const m1 = desc.match(/## Backlog Reference\s*\n\s*(KIN-\d+)/);
    const m2 = desc.match(/\*\*Backlog ID:\*\*\s*BL-(\d+)/);
    if (m1) jiraBacklogRefs.add(m1[1]);
    if (m2) jiraBacklogRefs.add("KIN-" + m2[1]);
  }
}

for (const f of pageFiles) {
  if (fs.existsSync(f)) processIssues(JSON.parse(fs.readFileSync(f, "utf8")));
}

// Page 3 data embedded - read from a saved file if exists, else skip
const page3 =
  "C:/Users/klasi/.cursor/projects/d-projects-Kinvue-tickets/agent-tools/page3.json";
if (fs.existsSync(page3))
  processIssues(JSON.parse(fs.readFileSync(page3, "utf8")));

// Also scan page2 for any BL- refs we might have missed in regex
for (const f of pageFiles) {
  if (!fs.existsSync(f)) continue;
  const raw = fs.readFileSync(f, "utf8");
  for (const m of raw.matchAll(
    /"description": "[^"]*(?:KIN-\d+|BL-\d+)[^"]*"/g,
  )) {
    const s = m[0];
    const m1 = s.match(/KIN-(\d+)/);
    const m2 = s.match(/BL-(\d+)/);
    if (m1) jiraBacklogRefs.add("KIN-" + m1[1]);
    if (m2) jiraBacklogRefs.add("KIN-" + m2[1]);
  }
}

const missingByRef = expected.filter((e) => !jiraBacklogRefs.has(e.key));
const missingBySummary = expected.filter(
  (e) => !jiraSummaries.has(e.summary) && !jiraBacklogRefs.has(e.key),
);

console.log(
  JSON.stringify(
    {
      expectedCount: expected.length,
      jiraBacklogRefCount: jiraBacklogRefs.size,
      jiraSummaryCount: jiraSummaries.size,
      missingByRef: missingByRef.length,
      missingByRefKeys: missingByRef.map((e) => e.key),
      missingBySummaryOnly: missingBySummary.length,
    },
    null,
    2,
  ),
);
