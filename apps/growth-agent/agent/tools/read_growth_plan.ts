import { defineTool } from "eve/tools";
import { z } from "zod";

export default defineTool({
  description: "Read the approved Creativv markets, offers, pricing boundaries, and outreach rules.",
  inputSchema: z.object({}),
  async execute() {
    return {
      market: "Caracas and Venezuela",
      verticals: ["ecommerce", "clinics", "real_estate", "academies"],
      campaignRule: "Run one intent + one vertical as a 14-day experiment. Do not mix offers inside a campaign.",
      outcomes: ["increase_revenue", "reduce_costs"],
      offers: [
        { service: "Landing page", range: "from USD 199", goal: "increase_revenue" },
        { service: "Web design", range: "from USD 699", goal: "increase_revenue" },
        { service: "Ecommerce", range: "custom scope", goal: "increase_revenue" },
        { service: "Automation", range: "from USD 499", goal: "reduce_costs" },
        { service: "Operations dashboard", range: "from USD 499", goal: "reduce_costs" },
        { service: "Custom app", range: "from USD 699", goal: "reduce_costs" },
      ],
      firstExperiment: {
        durationDays: 14,
        intent: "reduce_costs",
        vertical: "ecommerce",
        offer: "WhatsApp and operations automation",
        northStar: "qualified conversations per week",
      },
      rules: [
        "Evidence must include at least one public URL.",
        "Never claim unverified percentages, revenue, or savings.",
        "Create drafts only. Never send outreach.",
        "Social content may be queued to Postiz with a review window; WhatsApp Status or Channels require an approved content item.",
        "Store no personal data.",
      ],
    };
  },
});
