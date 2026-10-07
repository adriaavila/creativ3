import { z } from "zod";
import { whatsappUrl } from "./contact";

/**
 * «Agenda tu diagnóstico»: lo que deja quien quiere un proyecto de los
 * grandes. Se guarda en Neon (`diagnostico_request`) y avisa por correo a
 * hi@allok.fun si hay Resend; si nada de eso está, el formulario igual le
 * ofrece seguir por WhatsApp con su resumen ya escrito. Nadie se queda sin
 * camino.
 */

export const AREAS = [
  { id: "ventas", label: "Ventas y atención" },
  { id: "operacion", label: "Operación interna" },
  { id: "plataformas", label: "Plataforma para clientes" },
  { id: "web", label: "Web y marca" },
  { id: "nose", label: "Aún no lo sé" },
] as const;

export const BUDGETS = [
  { id: "lt5", label: "Menos de US$5.000" },
  { id: "5-10", label: "US$5.000 a 10.000" },
  { id: "10-25", label: "US$10.000 a 25.000" },
  { id: "25+", label: "Más de US$25.000" },
] as const;

type AreaId = (typeof AREAS)[number]["id"];
type BudgetId = (typeof BUDGETS)[number]["id"];

const areaIds = AREAS.map((a) => a.id) as [AreaId, ...AreaId[]];
const budgetIds = BUDGETS.map((b) => b.id) as [BudgetId, ...BudgetId[]];

/** Recorta en vez de rechazar: un formulario de venta no se cae por un párrafo largo. */
const text = (min: number, max: number) =>
  z
    .string()
    .trim()
    .min(min)
    .transform((s) => Array.from(s).slice(0, max).join(""));

export const diagnosticoSchema = z.object({
  name: text(2, 120),
  company: text(2, 160),
  email: z.string().trim().toLowerCase().pipe(z.email()).pipe(z.string().max(200)),
  phone: z
    .string()
    .trim()
    .max(40)
    .optional()
    .default("")
    .refine((s) => s === "" || s.replace(/\D/g, "").length >= 7, "phone"),
  website: z.string().trim().max(300).optional().default(""),
  areas: z.array(z.enum(areaIds)).max(AREAS.length).default([]),
  budget: z.enum(budgetIds).optional(),
  message: text(0, 2000).optional().default(""),
  /** Trampa para bots: un campo que una persona nunca ve. */
  company_url: z.string().max(0).optional().default(""),
  source: z.string().trim().max(120).optional().default(""),
});

export type DiagnosticoInput = z.input<typeof diagnosticoSchema>;
export type Diagnostico = z.output<typeof diagnosticoSchema>;

export function areaLabels(ids: readonly string[]): string[] {
  return ids.map((id) => AREAS.find((a) => a.id === id)?.label ?? id);
}

export function budgetLabel(id: string | undefined): string | null {
  return BUDGETS.find((b) => b.id === id)?.label ?? null;
}

/** El resumen que ve el equipo, y el que se precarga en WhatsApp si el envío falla. */
export function diagnosticoSummary(d: Pick<Diagnostico, "name" | "company" | "website" | "areas" | "budget" | "message">): string {
  const lines = [
    `Hola, soy ${d.name} de ${d.company}. Quiero agendar un diagnóstico con allok.`,
    d.website ? `Web: ${d.website}` : null,
    d.areas.length ? `Quiero mejorar: ${areaLabels(d.areas).join(", ")}` : null,
    budgetLabel(d.budget) ? `Presupuesto: ${budgetLabel(d.budget)}` : null,
    d.message ? `\n${d.message}` : null,
  ];
  return lines.filter(Boolean).join("\n");
}

export function diagnosticoWhatsapp(d: Parameters<typeof diagnosticoSummary>[0]): string {
  return whatsappUrl(diagnosticoSummary(d));
}

/** Un proyecto de los grandes: lo que el equipo mira primero en la bandeja. */
export function isHighTicket(d: Pick<Diagnostico, "budget">): boolean {
  return d.budget === "10-25" || d.budget === "25+";
}
