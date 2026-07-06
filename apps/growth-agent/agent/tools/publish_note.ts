import { defineTool } from "eve/tools";
import { z } from "zod";

// Commits a markdown note to the Obsidian vault repo via the GitHub Contents
// API (a deployed agent has an ephemeral filesystem, so it can't write to disk).
// Env: BRAIN_GITHUB_TOKEN (PAT, contents:write on one repo), BRAIN_REPO ("owner/repo"),
// BRAIN_DIR (vault subfolder, default "growth").
function slugify(s: string): string {
  // ponytail: accents fall through to "-" below; good enough for a filename slug.
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "nota";
}

export default defineTool({
  description:
    "Publish a markdown note to the team's Obsidian 2nd brain (git). Use for weekly summaries and durable learnings. Returns the committed file path.",
  inputSchema: z.object({
    title: z.string().min(3).max(120),
    body: z.string().min(20).max(20000),
    folder: z.string().max(80).default("growth"),
    tags: z.array(z.string().max(40)).max(12).default([]),
  }),
  async execute({ title, body, folder, tags }) {
    const token = process.env.BRAIN_GITHUB_TOKEN;
    const repo = process.env.BRAIN_REPO; // "owner/repo"
    if (!token || !repo) return { published: false, reason: "BRAIN_GITHUB_TOKEN/BRAIN_REPO not set" };

    const date = new Date().toISOString().slice(0, 10);
    const dir = (process.env.BRAIN_DIR ?? folder).replace(/^\/+|\/+$/g, "");
    const path = `${dir}/${date}-${slugify(title)}.md`;
    const frontmatter = [
      "---",
      `title: ${JSON.stringify(title)}`,
      `date: ${date}`,
      `tags: [${tags.map((t) => JSON.stringify(t)).join(", ")}]`,
      "source: growth-agent",
      "---",
      "",
    ].join("\n");
    const content = Buffer.from(frontmatter + body + "\n", "utf8").toString("base64");

    const api = `https://api.github.com/repos/${repo}/contents/${path}`;
    const headers = {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "User-Agent": "creativv-growth-agent",
    };
    // Same-day re-run: fetch existing SHA so the PUT updates instead of 422-ing.
    let sha: string | undefined;
    const existing = await fetch(api, { headers });
    if (existing.ok) sha = ((await existing.json()) as { sha?: string }).sha;

    const res = await fetch(api, {
      method: "PUT",
      headers: { ...headers, "content-type": "application/json" },
      body: JSON.stringify({ message: `growth: ${title}`, content, ...(sha ? { sha } : {}) }),
    });
    if (!res.ok) {
      return { published: false, reason: `github ${res.status}: ${(await res.text()).slice(0, 200)}` };
    }
    return { published: true, path, repo };
  },
});
