import { defineTool } from "eve/tools";
import { z } from "zod";

export default defineTool({
  description: "Read the approved Creativv markets, offers, pricing boundaries, and outreach rules.",
  inputSchema: z.object({}),
  async execute() {
    return {
      market: "Caracas and Venezuela",
      verticals: ["clinics", "real_estate", "ecommerce", "academies"],
      outcomes: ["sell_more", "reduce_costs"],
      offers: [
        { service: "Landing / Web", range: "USD 199", goal: "sell_more" },
        { service: "Digital product / Dashboard", range: "from USD 499", goal: "both" },
        { service: "Automation / AI agent", range: "from USD 699", goal: "reduce_costs" },
      ],
      rules: [
        "Evidence must include at least one public URL.",
        "Never claim unverified percentages, revenue, or savings.",
        "Create drafts only. Never send outreach.",
        "Store no personal data.",
      ],
    };
  },
});
