import { defineTool } from "eve/tools";
import { z } from "zod";
import { DAILY_LEADS, INVITE_URL, MARKETS, MIN_SCORE, OFFER, VERTICALS } from "../../lib/offer.js";

export default defineTool({
  description: "Read what allok sells today, where, to whom, the lead filter and the outreach rules.",
  inputSchema: z.object({}),
  async execute() {
    return {
      offer: OFFER,
      markets: MARKETS,
      verticals: VERTICALS,
      idealCustomer:
        "Negocio que vende o agenda por WhatsApp y no alcanza a contestar a todos o contesta tarde " +
        "(abogados, estética y spa, clínicas, inmobiliarias).",
      filter: {
        minScore: MIN_SCORE,
        perDay: DAILY_LEADS,
        required: ["WhatsApp público verificado con contactSourceUrl", "señal concreta de que vende por WhatsApp", "≥1 URL pública de evidencia"],
      },
      firstMessage: {
        goal: "Invitarlo a probar el agente como si fuera un cliente. No vender en el primer mensaje.",
        mustInclude: INVITE_URL,
      },
      followUps: "followup_1 a los 2 días sin respuesta, followup_2 a los 5. Después, nada.",
      rules: [
        "Evidence must include at least one public URL.",
        "Never claim unverified percentages, revenue, or savings.",
        "Create drafts only. Never send outreach: Adrian sends each one from his phone.",
        "No long dashes (— or –) and no emojis in drafts.",
        "Store no personal data beyond the business's public WhatsApp.",
      ],
    };
  },
});
