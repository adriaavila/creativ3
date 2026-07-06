import { defineTool } from "eve/tools";
import { z } from "zod";

// Queues a social post to Postiz for HUMAN review before it publishes.
// Postiz's public API has no "draft" type — we schedule it into the future
// (default +48h) so the human reviews/edits/deletes it in Postiz first.
// Env: POSTIZ_URL (default https://api.postiz.com), POSTIZ_API_KEY,
// POSTIZ_DEFAULT_INTEGRATION (channel id used when integrationId is omitted),
// POSTIZ_REVIEW_HOURS (review window, default 48).
export default defineTool({
  description:
    "Queue one social post (LinkedIn/X/Instagram) to Postiz, scheduled in the future for mandatory human review. Never publishes immediately.",
  inputSchema: z.object({
    platform: z.enum(["x", "linkedin", "instagram", "facebook", "threads", "tiktok"]),
    content: z.string().min(10).max(3000),
    // Postiz channel ("integration") id. Falls back to POSTIZ_DEFAULT_INTEGRATION.
    integrationId: z.string().optional(),
    reviewHours: z.number().int().min(1).max(720).optional(),
  }),
  async execute({ platform, content, integrationId, reviewHours }) {
    const base = (process.env.POSTIZ_URL ?? "https://api.postiz.com").replace(/\/+$/, "");
    const key = process.env.POSTIZ_API_KEY;
    const integration = integrationId ?? process.env.POSTIZ_DEFAULT_INTEGRATION;
    if (!key || !integration) {
      return { queued: false, reason: "POSTIZ_API_KEY / integration id not set" };
    }
    const hours = reviewHours ?? Number(process.env.POSTIZ_REVIEW_HOURS ?? 48);
    const date = new Date(Date.now() + hours * 3600_000).toISOString();

    const res = await fetch(`${base}/public/v1/posts`, {
      method: "POST",
      headers: { Authorization: key, "content-type": "application/json" },
      body: JSON.stringify({
        type: "schedule",
        date,
        shortLink: false,
        tags: [],
        posts: [
          {
            integration: { id: integration },
            value: [{ content, image: [] }],
            settings: { __type: platform },
          },
        ],
      }),
    });
    if (!res.ok) {
      return { queued: false, reason: `postiz ${res.status}: ${(await res.text()).slice(0, 200)}` };
    }
    return { queued: true, platform, scheduledFor: date, reviewHours: hours };
  },
});
