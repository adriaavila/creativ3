import { Resend } from "resend";
import { CONTACT_EMAIL } from "@/lib/contact";
import { clientIp, createWindowLimiter } from "@/lib/demo-rate-limit";
import { budgetLabel, areaLabels, diagnosticoSchema, diagnosticoSummary, diagnosticoWhatsapp, isHighTicket, type Diagnostico } from "@/lib/diagnostico";
import { saveDiagnostico } from "@/lib/diagnostico-db";

export const dynamic = "force-dynamic";

/** Cinco solicitudes por visitante al día: una persona manda una, un bot cientos. */
const perDay = createWindowLimiter(5, 24 * 60 * 60 * 1000);

/**
 * La solicitud de diagnóstico de la portada. Se guarda y se avisa; lo que
 * falle de esas dos cosas no le cuesta la solicitud a quien la manda: la
 * respuesta siempre trae el enlace de WhatsApp con su resumen, y el
 * formulario lo ofrece cuando nada quedó guardado.
 */
export async function POST(request: Request) {
  const parsed = diagnosticoSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    const field = String(parsed.error.issues[0]?.path[0] ?? "");
    return Response.json({ error: { code: "invalid", field } }, { status: 400 });
  }
  if (!perDay.take(clientIp(request.headers))) {
    return Response.json({ error: { code: "rate_limited" }, whatsapp: diagnosticoWhatsapp(parsed.data) }, { status: 429 });
  }

  const d = parsed.data;
  const [saved, notified] = await Promise.all([
    saveDiagnostico(d).catch((error) => {
      console.error("[diagnostico] no se guardó", error);
      return false;
    }),
    notify(d).catch((error) => {
      console.error("[diagnostico] no se avisó", error);
      return false;
    }),
  ]);

  return Response.json({ ok: true, received: saved || notified, whatsapp: diagnosticoWhatsapp(d) });
}

async function notify(d: Diagnostico): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  if (!apiKey || !from) return false;
  const budget = budgetLabel(d.budget) ?? "sin decir";
  const subject = `${isHighTicket(d) ? "★ " : ""}Diagnóstico: ${d.company} · ${budget}`;
  const lines = [
    diagnosticoSummary(d),
    "",
    `Correo: ${d.email}`,
    d.phone ? `Teléfono: ${d.phone}` : null,
    d.areas.length ? `Áreas: ${areaLabels(d.areas).join(", ")}` : null,
    d.source ? `Origen: ${d.source}` : null,
  ].filter((l) => l !== null);
  const { error } = await new Resend(apiKey).emails.send({
    from,
    to: process.env.OPS_ALERT_EMAIL || CONTACT_EMAIL,
    replyTo: d.email,
    subject,
    text: lines.join("\n"),
  });
  if (error) throw new Error(error.message);
  return true;
}
