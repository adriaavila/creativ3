import { defineEval } from "eve/evals";

// Voz del copywriter (ver subagents/copywriter/instructions.md): invita a probar
// el agente con el link, menciona una señal concreta, no inventa métricas, sin
// precio ni rayas largas. Juez LLM sobre el primer mensaje de ejemplo.
export default defineEval({
  description: "First WhatsApp message invites them to try the agent with the link, cites a signal, invents nothing.",
  async test(t) {
    await t.send(
      "Escribe el primer mensaje de WhatsApp (kind dm) para un estudio de abogados en Santiago de Chile " +
        "cuyo Instagram pide escribir al WhatsApp para agendar una consulta. Usa el link de invitación del plan. " +
        "Solo el texto del mensaje, no llames create_draft.",
    );
    t.completed();
    t.messageIncludes(/wa\.me\/584220023684\?text=/);
    await t.judge.autoevals.closedQA(
      "Is the message all of: (1) an invitation to try the agent as if they were a client, not a sales pitch " +
        "with prices; (2) references a concrete observed signal about the business; (3) invents NO metrics, " +
        "sales, savings or client numbers; (4) short and human, informal 'tú' Spanish; (5) contains no long " +
        "dashes (— or –) and no emojis?",
    ).gate();
  },
});
