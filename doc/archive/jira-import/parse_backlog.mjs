import fs from "fs";

const content = fs.readFileSync(
  "d:/projects/Kinvue_tickets/28_JIRA_BACKLOG.md",
  "utf8",
);

const epicMap = {
  "KIN-0": "KIN-1",
  "KIN-10": "KIN-3",
  "KIN-20": "KIN-4",
  "KIN-30": "KIN-5",
  "KIN-100": "KIN-6",
  "KIN-110": "KIN-7",
  "KIN-120": "KIN-8",
  "KIN-130": "KIN-9",
  "KIN-200": "KIN-10",
  "KIN-210": "KIN-11",
  "KIN-220": "KIN-12",
  "KIN-230": "KIN-13",
  "KIN-300": "KIN-14",
  "KIN-310": "KIN-15",
  "KIN-320": "KIN-16",
  "KIN-400": "KIN-17",
  "KIN-410": "KIN-18",
  "KIN-420": "KIN-19",
  "KIN-430": "KIN-20",
  "KIN-440": "KIN-21",
  "KIN-500": "KIN-22",
  "KIN-510": "KIN-23",
  "KIN-520": "KIN-28",
  "KIN-530": "KIN-24",
  "KIN-600": "KIN-29",
  "KIN-610": "KIN-26",
  "KIN-620": "KIN-27",
  "KIN-630": "KIN-25",
  "KIN-700": "KIN-30",
  "KIN-710": "KIN-31",
  "KIN-720": "KIN-32",
};

const created = new Set([
  "KIN-1",
  "KIN-2",
  "KIN-3",
  "KIN-4",
  "KIN-5",
  "KIN-11",
  "KIN-12",
  "KIN-13",
  "KIN-14",
  "KIN-15",
  "KIN-16",
  "KIN-21",
  "KIN-22",
  "KIN-23",
  "KIN-24",
  "KIN-25",
  "KIN-26",
  "KIN-27",
  "KIN-31",
  "KIN-32",
  "KIN-33",
  "KIN-34",
  "KIN-35",
  "KIN-36",
  "KIN-37",
  "KIN-38",
  "KIN-39",
  "KIN-101",
  "KIN-102",
  "KIN-103",
  "KIN-104",
  "KIN-111",
  "KIN-112",
  "KIN-113",
  "KIN-114",
  "KIN-121",
  "KIN-122",
  "KIN-123",
  "KIN-124",
  "KIN-125",
  "KIN-126",
]);

let currentEpic = null;
const issues = [];

for (const line of content.split(/\r?\n/)) {
  const epicMatch = line.match(/^### Epic (KIN-\d+):/);
  if (epicMatch) currentEpic = epicMatch[1];
  const trimmed = line.trim();
  if (!trimmed.startsWith("| KIN-") || trimmed.includes("-----")) continue;
  const parts = trimmed
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((p) => p.trim());
  if (parts.length < 6) continue;
  const [key, type, summary, sp, labelsStr, depends] = parts;
  if (created.has(key)) continue;
  const desc = `## Backlog Reference\n${key}\n\n## Story Points\n${sp}\n\n## Depends On\n${depends}\n\n## Source\n28_JIRA_BACKLOG.md`;
  issues.push({
    backlog_key: key,
    issueTypeName: type,
    summary: summary.replace(/`/g, ""),
    description: desc,
    labels: labelsStr.split(",").map((s) => s.trim()),
    parent: epicMap[currentEpic],
  });
}

fs.writeFileSync(
  "d:/projects/Kinvue_tickets/remaining_issues.json",
  JSON.stringify({ count: issues.length, issues }, null, 2),
);
console.log(`Remaining: ${issues.length}`);
console.log(
  `First: ${issues[0]?.backlog_key}, Last: ${issues[issues.length - 1]?.backlog_key}`,
);
