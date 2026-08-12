import type { Locale } from "@/lib/i18n";

const RECOMMENDATIONS: Record<Locale, Record<string, string[]>> = {
  es: {
    "Respondemos tarde": [
      "Inbox compartido con prioridad por conversación",
      "Respuestas sugeridas para las consultas repetidas",
      "Alertas cuando un cliente sigue esperando",
    ],
    "Se nos pierden consultas": [
      "Captura automática de cada consulta",
      "Pipeline con responsable y próximo paso",
      "Seguimientos programados antes de que el cliente se enfríe",
    ],
    "No sabemos qué falta cerrar": [
      "Pipeline con etapas y valor de cada oportunidad",
      "Próximo paso visible para cada conversación",
      "Panel de propuestas, cierres y oportunidades detenidas",
    ],
    "Todo depende de una sola persona": [
      "Inbox compartido con responsables claros",
      "Reglas para distribuir y escalar conversaciones",
      "Historial y próximos pasos visibles para todo el equipo",
    ],
  },
  en: {
    "We reply too slowly": [
      "A shared inbox prioritized by conversation",
      "Suggested replies for recurring inquiries",
      "Alerts when a customer is still waiting",
    ],
    "Inquiries get lost": [
      "Automatic capture of every inquiry",
      "A pipeline with an owner and next step",
      "Scheduled follow-ups before the customer goes cold",
    ],
    "We don't know what's left to close": [
      "A pipeline with stages and opportunity values",
      "A visible next step for every conversation",
      "A view of proposals, wins, and stalled opportunities",
    ],
    "Everything depends on one person": [
      "A shared inbox with clear owners",
      "Rules to distribute and escalate conversations",
      "History and next steps visible to the whole team",
    ],
  },
};

const FALLBACK: Record<Locale, string[]> = {
  es: ["Inbox conectado a WhatsApp", "Pipeline con etapas claras", "Seguimiento programado"],
  en: ["A WhatsApp-connected inbox", "A pipeline with clear stages", "Scheduled follow-up"],
};

export function qualificationRecommendations(locale: Locale, bottleneck?: string) {
  return (bottleneck && RECOMMENDATIONS[locale][bottleneck]) || FALLBACK[locale];
}
