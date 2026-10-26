/**
 * Reads pending-description-updates.json and applies descriptions via Jira REST API.
 * Uses ATLASSIAN_API_TOKEN + ATLASSIAN_EMAIL env vars, or falls back to MCP-only mode message.
 */
import fs from "fs";
import path from "path";

const CLOUD_ID = "42bf3060-77dc-4f97-9b96-cdfa523fe9c7";
const ROOT = path.resolve("d:/projects/Kinvue_tickets/scripts");
const pendingFile = path.join(ROOT, "pending-description-updates.json");
const progressFile = path.join(ROOT, "apply-progress.json");
const resultsFile = path.join(ROOT, "_apply-results.json");

const email = process.env.ATLASSIAN_EMAIL;
const token = process.env.ATLASSIAN_API_TOKEN;
const startIdx = Number(process.env.START_IDX || 0);
const batchSize = Number(process.env.BATCH_SIZE || 8);

const pending = JSON.parse(fs.readFileSync(pendingFile, "utf8"));
const slice = pending.slice(startIdx, startIdx + batchSize);

if (!email || !token) {
  console.error("Missing ATLASSIAN_EMAIL or ATLASSIAN_API_TOKEN");
  process.exit(1);
}

const results = { success: [], failed: [] };

for (const item of slice) {
  const url = `https://api.atlassian.com/ex/jira/${CLOUD_ID}/rest/api/3/issue/${item.key}`;
  const body = {
    fields: {
      description: {
        type: "doc",
        version: 1,
        content: markdownToAdf(item.description),
      },
    },
  };
  try {
    const res = await fetch(url, {
      method: "PUT",
      headers: {
        Authorization: `Basic ${Buffer.from(`${email}:${token}`).toString("base64")}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const text = await res.text();
      results.failed.push({
        key: item.key,
        status: res.status,
        message: text.slice(0, 500),
      });
    } else {
      results.success.push(item.key);
    }
  } catch (err) {
    results.failed.push({ key: item.key, message: String(err) });
  }
}

let all = { success: [], failed: [] };
if (fs.existsSync(resultsFile))
  all = JSON.parse(fs.readFileSync(resultsFile, "utf8"));
all.success.push(...results.success);
all.failed.push(...results.failed);
fs.writeFileSync(resultsFile, JSON.stringify(all, null, 2));
console.log(
  JSON.stringify({ batch: slice.map((x) => x.key), ...results }, null, 2),
);

function markdownToAdf(md) {
  const lines = md.replace(/\r\n/g, "\n").split("\n");
  const content = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (line.startsWith("## ")) {
      content.push({
        type: "heading",
        attrs: { level: 2 },
        content: [{ type: "text", text: line.slice(3) }],
      });
      i++;
      continue;
    }
    if (line.startsWith("- ")) {
      const items = [];
      while (i < lines.length && lines[i].startsWith("- ")) {
        items.push({
          type: "listItem",
          content: [
            {
              type: "paragraph",
              content: parseInline(lines[i].slice(2)),
            },
          ],
        });
        i++;
      }
      content.push({ type: "bulletList", content: items });
      continue;
    }
    if (/^\d+\.\s/.test(line)) {
      const items = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        items.push({
          type: "listItem",
          content: [
            {
              type: "paragraph",
              content: parseInline(lines[i].replace(/^\d+\.\s/, "")),
            },
          ],
        });
        i++;
      }
      content.push({
        type: "orderedList",
        attrs: { order: 1 },
        content: items,
      });
      continue;
    }
    if (line.trim() === "") {
      i++;
      continue;
    }
    content.push({ type: "paragraph", content: parseInline(line) });
    i++;
  }
  return content;
}

function parseInline(text) {
  const parts = text.split(/(`[^`]+`)/g);
  const nodes = [];
  for (const part of parts) {
    if (!part) continue;
    if (part.startsWith("`") && part.endsWith("`")) {
      nodes.push({
        type: "text",
        text: part.slice(1, -1),
        marks: [{ type: "code" }],
      });
    } else {
      nodes.push({ type: "text", text: part });
    }
  }
  return nodes.length ? nodes : [{ type: "text", text: "" }];
}
