import { defineEval } from "eve/evals";

// Voz del copywriter (ver subagents/copywriter/instructions.md): no vende
// "página web", menciona una señal concreta observada, no inventa métricas,
// tono humano y corto. Juez LLM sobre el DM de ejemplo.
export default defineEval({
  description: "First-DM voice: sells outcomes not a website, cites a concrete signal, invents no metrics.",
  async test(t) {
    await t.send(
      "Escribe un DM de ejemplo (primer contacto) para una clínica dental en Caracas cuyo " +
        "Instagram no tiene link de agendamiento y responde mensajes con demora. Solo el texto del DM.",
    );
    t.completed();
    await t.judge.autoevals.closedQA(
      "Is the message all of: (1) does NOT sell a 'website/página web' as the product but a commercial " +
        "outcome (more clients, less friction, better process); (2) references a concrete observed signal " +
        "about the business; (3) invents NO specific metrics, sales, savings or client numbers; " +
        "(4) short and human, not a corporate template?",
    ).gate();
  },
});
