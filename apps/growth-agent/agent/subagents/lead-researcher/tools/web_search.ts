import { defineTool } from "eve/tools";
import { z } from "zod";

// Self-contained web search via Tavily (free tier). Set TAVILY_API_KEY.
// To use another provider (Serper, Brave), swap the fetch below.
export default defineTool({
  description:
    "Search the public web for businesses and commercial signals. Returns titles, URLs, and short snippets. Use it to find real businesses with verifiable public sources.",
  inputSchema: z.object({
    query: z.string().min(3).max(400),
    maxResults: z.number().int().min(1).max(10).default(5),
  }),
  async execute({ query, maxResults }) {
    const key = process.env.TAVILY_API_KEY;
    if (!key) throw new Error("TAVILY_API_KEY is not set; cannot search the web.");
    const res = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        api_key: key,
        query,
        max_results: maxResults,
        search_depth: "basic",
      }),
    });
    if (!res.ok) throw new Error(`Tavily search failed: ${res.status} ${await res.text().catch(() => "")}`);
    const data = (await res.json()) as { results?: Array<{ title?: string; url?: string; content?: string }> };
    return {
      results: (data.results ?? []).map((r) => ({
        title: r.title ?? "",
        url: r.url ?? "",
        snippet: (r.content ?? "").slice(0, 500),
      })),
    };
  },
});
