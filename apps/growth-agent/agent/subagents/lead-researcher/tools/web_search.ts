import { defineTool } from "eve/tools";
import { z } from "zod";

type Hit = { title: string; url: string; snippet: string };

// Each provider returns normalized hits or throws. Order = fallback priority.
const TIMEOUT = AbortSignal.timeout.bind(AbortSignal);

async function tavily(query: string, n: number): Promise<Hit[]> {
  const key = process.env.TAVILY_API_KEY;
  if (!key) throw new Error("no TAVILY_API_KEY");
  const r = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ api_key: key, query, max_results: n, search_depth: "basic" }),
    signal: TIMEOUT(15000),
  });
  if (!r.ok) throw new Error(`tavily ${r.status}`);
  const d = (await r.json()) as { results?: Array<{ title?: string; url?: string; content?: string }> };
  return (d.results ?? []).map((x) => ({ title: x.title ?? "", url: x.url ?? "", snippet: (x.content ?? "").slice(0, 500) }));
}

async function brave(query: string, n: number): Promise<Hit[]> {
  const key = process.env.BRAVE_API_KEY;
  if (!key) throw new Error("no BRAVE_API_KEY");
  const r = await fetch(`https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=${n}`, {
    headers: { Accept: "application/json", "X-Subscription-Token": key },
    signal: TIMEOUT(15000),
  });
  if (!r.ok) throw new Error(`brave ${r.status}`);
  const d = (await r.json()) as { web?: { results?: Array<{ title?: string; url?: string; description?: string }> } };
  return (d.web?.results ?? []).map((x) => ({ title: x.title ?? "", url: x.url ?? "", snippet: (x.description ?? "").slice(0, 500) }));
}

async function firecrawl(query: string, n: number): Promise<Hit[]> {
  const key = process.env.FIRECRAWL_API_KEY;
  if (!key) throw new Error("no FIRECRAWL_API_KEY");
  const r = await fetch("https://api.firecrawl.dev/v1/search", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${key}` },
    body: JSON.stringify({ query, limit: n }),
    signal: TIMEOUT(20000),
  });
  if (!r.ok) throw new Error(`firecrawl ${r.status}`);
  const d = (await r.json()) as { data?: Array<{ title?: string; url?: string; description?: string }> };
  return (d.data ?? []).map((x) => ({ title: x.title ?? "", url: x.url ?? "", snippet: (x.description ?? "").slice(0, 500) }));
}

const PROVIDERS = [
  { name: "tavily", fn: tavily },
  { name: "brave", fn: brave },
  { name: "firecrawl", fn: firecrawl },
];

export default defineTool({
  description:
    "Search the public web for businesses and commercial signals. Returns titles, URLs, and short snippets. Falls back across multiple providers so it always works. Use it to find real businesses with verifiable public sources.",
  inputSchema: z.object({
    query: z.string().min(3).max(400),
    maxResults: z.number().int().min(1).max(10).default(5),
  }),
  async execute({ query, maxResults }) {
    const notes: string[] = [];
    for (const p of PROVIDERS) {
      try {
        const hits = await p.fn(query, maxResults);
        if (hits.length > 0) return { provider: p.name, results: hits };
        notes.push(`${p.name}: 0 results`);
      } catch (e) {
        notes.push(`${p.name}: ${e instanceof Error ? e.message : String(e)}`);
      }
    }
    // Never throw: empty result lets the agent retry with a simpler query
    // instead of failing the whole run.
    return {
      results: [] as Hit[],
      note: `No results for "${query}". Try a simpler, broader query (e.g. "academias Caracas Instagram"). Tried — ${notes.join("; ")}`,
    };
  },
});
