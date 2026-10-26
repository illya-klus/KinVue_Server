#!/usr/bin/env python3
"""Parse 28_JIRA_BACKLOG.md and output issue creation payloads as JSON."""
import json
import re
from pathlib import Path

BACKLOG = Path(__file__).parent.parent / "28_JIRA_BACKLOG.md"

# Backlog epic ref -> Jira epic key (existing + placeholders for new)
EPIC_MAP = {
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
    "KIN-520": "PLACEHOLDER-520",
    "KIN-530": "PLACEHOLDER-530",
    "KIN-600": "PLACEHOLDER-600",
    "KIN-610": "PLACEHOLDER-610",
    "KIN-620": "PLACEHOLDER-620",
    "KIN-630": "PLACEHOLDER-630",
    "KIN-700": "PLACEHOLDER-700",
    "KIN-710": "PLACEHOLDER-710",
    "KIN-720": "PLACEHOLDER-720",
}

NEW_EPICS = [
    {"backlog_ref": "KIN-520", "summary": "[Epic] Transcoding Worker", "labels": ["backend", "media"]},
    {"backlog_ref": "KIN-530", "summary": "[Epic] Signed Media Playback", "labels": ["backend", "media", "movies", "security"]},
    {"backlog_ref": "KIN-600", "summary": "[Epic] Scheduled Watch Rooms", "labels": ["backend", "rooms", "movies"]},
    {"backlog_ref": "KIN-610", "summary": "[Epic] Observability", "labels": ["backend", "observability"]},
    {"backlog_ref": "KIN-620", "summary": "[Epic] Security Hardening", "labels": ["security", "backend", "infra"]},
    {"backlog_ref": "KIN-630", "summary": "[Epic] CI/CD Pipeline", "labels": ["infra", "testing"]},
    {"backlog_ref": "KIN-700", "summary": "[Epic] End-to-End Test Suite", "labels": ["testing"]},
    {"backlog_ref": "KIN-710", "summary": "[Epic] MVP Deployment", "labels": ["infra"]},
    {"backlog_ref": "KIN-720", "summary": "[Epic] Documentation Refresh & Release", "labels": ["docs", "infra", "testing"]},
]

ACCEPTANCE_CRITERIA = {
    "KIN-3": [
        "`pnpm install` succeeds",
        "`pnpm build` runs (even if apps are empty stubs)",
        "Workspace includes `apps/*`, `packages/*`, `tests/*`",
    ],
    "KIN-12": [
        "`pnpm infra:up` starts all containers",
        "RabbitMQ UI reachable at `localhost:15672`",
        "MinIO console reachable at `localhost:9001`",
        "Meilisearch health returns OK",
    ],
    "KIN-126": [
        "Generates global `userId` before DB write",
        "Status flow: `PENDING` → `PROFILE_CREATING` → `ACTIVE`",
        "Calls `POST /internal/users/profiles` idempotently",
        "Returns 201 only when Auth + Users both exist",
        "Retries Users 3x, then compensates with 503",
        "Duplicate email returns 409",
    ],
}

SKIP_BACKLOG_KEYS = {"KIN-1"}  # toolchain task already created as Jira KIN-2

# Epic section -> backlog epic ref
EPIC_SECTIONS = [
    ("KIN-0", "Developer Environment & Repo Bootstrap"),
    ("KIN-10", "Local Infrastructure (Docker Compose)"),
    ("KIN-20", "Shared Packages"),
    ("KIN-30", "Service Skeletons"),
    ("KIN-100", "Auth Data Model"),
    ("KIN-110", "Users Data Model"),
    ("KIN-120", "Auth Service API"),
    ("KIN-130", "Users Service API"),
    ("KIN-200", "API Gateway"),
    ("KIN-210", "Web App Foundation"),
    ("KIN-220", "Auth UI Vertical Slice"),
    ("KIN-230", "Social UI Vertical Slice"),
    ("KIN-300", "Movie Data Model"),
    ("KIN-310", "Movie Service API"),
    ("KIN-320", "Movie UI"),
    ("KIN-400", "Rooms HTTP Control API"),
    ("KIN-410", "Rooms WebSocket + Presence"),
    ("KIN-420", "Playback Synchronization"),
    ("KIN-430", "Room Chat & Reactions"),
    ("KIN-440", "Room Web Experience"),
    ("KIN-500", "Notifications Service"),
    ("KIN-510", "Admin Media Upload"),
    ("KIN-520", "Transcoding Worker"),
    ("KIN-530", "Signed Media Playback"),
    ("KIN-600", "Scheduled Watch Rooms"),
    ("KIN-610", "Observability"),
    ("KIN-620", "Security Hardening"),
    ("KIN-630", "CI/CD Pipeline"),
    ("KIN-700", "End-to-End Test Suite"),
    ("KIN-710", "MVP Deployment"),
    ("KIN-720", "Documentation Refresh & Release"),
]


def parse_labels(label_str):
    return [l.strip() for l in label_str.split(",") if l.strip()]


def build_description(backlog_key, sp, depends_on, ac_lines=None):
    parts = [
        f"**Backlog Reference:** {backlog_key}",
        f"**Story Points:** {sp}",
        f"**Depends On:** {depends_on if depends_on and depends_on != '—' else 'None'}",
        "",
        "**Acceptance Criteria:**",
    ]
    if ac_lines:
        for line in ac_lines:
            parts.append(f"- {line}")
    else:
        parts.append("- See Definition of Done in backlog")
    parts.extend(["", "**Source:** 28_JIRA_BACKLOG.md"])
    return "\n".join(parts)


def parse_backlog():
    text = BACKLOG.read_text(encoding="utf-8")
    current_epic = None
    issues = []

    for line in text.splitlines():
        epic_match = re.match(r"### Epic (KIN-\d+):", line)
        if epic_match:
            current_epic = epic_match.group(1)
            continue

        row_match = re.match(
            r"\| (KIN-\d+) \| (Story|Task) \| (.+?) \| (\d+) \| (.+?) \| (.+?) \|",
            line,
        )
        if row_match and current_epic:
            key, itype, summary, sp, labels, depends = row_match.groups()
            if key in SKIP_BACKLOG_KEYS:
                continue
            ac = ACCEPTANCE_CRITERIA.get(key)
            issues.append({
                "backlog_key": key,
                "issueTypeName": itype,
                "summary": summary.strip(),
                "story_points": int(sp),
                "labels": parse_labels(labels),
                "depends_on": depends.strip(),
                "epic_backlog_ref": current_epic,
                "description": build_description(key, sp, depends.strip(), ac),
            })

    return issues


def main():
    issues = parse_backlog()
    print(json.dumps({"new_epics": NEW_EPICS, "issues": issues, "count": len(issues)}, indent=2))


if __name__ == "__main__":
    main()
