import re
import json

with open(r"d:\projects\Kinvue_tickets\28_JIRA_BACKLOG.md", encoding="utf-8") as f:
    content = f.read()

rows = []
current_epic = None
for line in content.splitlines():
    if line.startswith("### Epic "):
        m = re.match(r"### Epic (KIN-\d+):", line)
        if m:
            current_epic = m.group(1)
    if line.startswith("| KIN-") and "-----" not in line:
        parts = [p.strip() for p in line.strip("|").split("|")]
        if len(parts) >= 7 and parts[0].startswith("KIN-"):
            rows.append(
                {
                    "key": parts[0],
                    "type": parts[1],
                    "summary": parts[2],
                    "sp": parts[3],
                    "labels": [x.strip() for x in parts[4].split(",")],
                    "depends": parts[5],
                    "epic_ref": current_epic,
                }
            )

epic_map = {
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
}

created_backlog_keys = {
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
}

acceptance = {}

issues = []
for r in rows:
    if r["key"] in created_backlog_keys:
        continue
    desc = (
        f"## Backlog Reference\n{r['key']}\n\n"
        f"## Story Points\n{r['sp']}\n\n"
        f"## Depends On\n{r['depends']}\n"
    )
    if r["key"] in acceptance:
        desc += "\n## Acceptance Criteria\n"
        desc += "\n".join(f"- {a}" for a in acceptance[r["key"]]) + "\n"
    desc += "\n## Source\n28_JIRA_BACKLOG.md"
    issues.append(
        {
            "backlog_key": r["key"],
            "issueTypeName": r["type"],
            "summary": r["summary"].replace("`", ""),
            "description": desc,
            "labels": r["labels"],
            "parent": epic_map[r["epic_ref"]],
        }
    )

with open(r"d:\projects\Kinvue_tickets\remaining_issues.json", "w", encoding="utf-8") as f:
    json.dump({"count": len(issues), "issues": issues}, f, indent=2)

print(f"Remaining: {len(issues)}")
if issues:
    print(f"First: {issues[0]['backlog_key']}")
    print(f"Last: {issues[-1]['backlog_key']}")
