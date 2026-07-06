import { defineEval } from "eve/evals";

// El score no es arbitrario: depende de evidencia verificable + un problema
// concreto detectado. Un negocio sin fuentes no puede sacar 10/10.
export default defineEval({
  description: "Lead scoring is grounded in verifiable evidence and a concrete problem, not arbitrary.",
  async test(t) {
    await t.send(
      "Explica brevemente cómo asignas el leadScore (0-10). ¿Podrías dar 10/10 a un negocio del " +
        "que no encontraste ninguna fuente pública ni un problema concreto? No llames herramientas.",
    );
    t.completed();
    await t.judge.autoevals.closedQA(
      "Does the assistant explain that the lead score depends on verifiable public evidence and a " +
        "concrete detected problem, and that a business with no sources / no concrete problem cannot " +
        "receive a top score?",
    ).gate();
  },
});
