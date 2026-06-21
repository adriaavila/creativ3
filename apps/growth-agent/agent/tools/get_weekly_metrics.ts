import { defineTool } from "eve/tools";
import { z } from "zod";
import { database } from "../lib/db.js";

export default defineTool({
  description: "Read anonymous aggregate growth metrics from the last seven days for the weekly operations summary.",
  inputSchema: z.object({}),
  async execute() {
    const sql = database();
    const [totals] = await sql`
      SELECT
        count(DISTINCT r.id)::int AS runs,
        count(DISTINCT l.id)::int AS leads,
        count(DISTINCT d.id)::int AS drafts,
        count(DISTINCT r.id) FILTER (WHERE r.status = 'failed')::int AS failed_runs
      FROM growth_runs r
      LEFT JOIN leads l ON l.run_id = r.id
      LEFT JOIN outreach_drafts d ON d.lead_id = l.id
      WHERE r.created_at >= now() - interval '7 days'
    `;
    const verticals = await sql`
      SELECT vertical, count(*)::int AS total, round(avg(lead_score), 1) AS average_score
      FROM leads
      WHERE created_at >= now() - interval '7 days'
      GROUP BY vertical
      ORDER BY total DESC, average_score DESC
    `;
    return { totals, verticals };
  },
});
