function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character] ?? character);
}

/**
 * El mismo recibo para todos los cobros: sólo cambian el título, el párrafo y la línea.
 * En el sistema de diseño de allok.fun: Cloud, Ink y Geist (con Helvetica/Arial de respaldo en
 * los correos que no la cargan), el logotipo dibujado como imagen (Gmail no muestra SVG), sin
 * radios ni sombras. El punto verde es el único color de estado: el pago está confirmado.
 */
function receiptHtml({ headline, body, lineItem, total }: { headline: string; body: string; lineItem: string; total: string }) {
  const font = "Geist,'Helvetica Neue',Helvetica,Arial,sans-serif";
  const line = "1px solid #d9dddf";
  return `<!doctype html><html lang="es"><body style="margin:0;background:#f7f8f8;color:#0b0d0e;font-family:${font}"><main style="max-width:620px;margin:32px auto;background:#ffffff;border:${line}"><header style="padding:28px 36px;border-bottom:${line};display:flex;align-items:center;justify-content:space-between"><img src="https://allok.fun/allok/email/wordmark-ink.png" width="96" height="40" alt="allok" style="display:block;border:0"><span style="display:inline-flex;align-items:center;gap:6px;font-size:12px;color:#0b0d0e"><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#20e58d"></span>Pago confirmado</span></header><section style="padding:44px 36px"><p style="margin:0;font-size:11px;letter-spacing:0.04em;color:#697278;text-transform:uppercase">Confirmación de pago</p><h1 style="font-size:34px;line-height:1.05;font-weight:600;letter-spacing:-0.04em;margin:16px 0">${headline}</h1><p style="color:#586168;line-height:1.55">${body}</p><table style="width:100%;margin:28px 0;border-collapse:collapse;border-top:1px solid #0b0d0e;border-bottom:${line}"><tr><td style="padding:18px 0">${lineItem}</td><td style="padding:18px 0;text-align:right;font-weight:600">${total}</td></tr><tr><td style="padding:16px 0;border-top:${line};font-weight:600;font-size:18px">Total pagado</td><td style="padding:16px 0;border-top:${line};text-align:right;font-weight:600;font-size:18px;color:#315cff">${total}</td></tr></table><p style="font-size:13px;color:#586168;line-height:1.55">¿Tienes una pregunta? Responde a este correo y te ayudamos.</p></section><footer style="padding:24px 36px;background:#0b0d0e;color:#9da6ab;font-size:12px;line-height:1.6">allok · Sistemas digitales para vender más y operar mejor</footer></main></body></html>`;
}

export function projectPaymentEmail({
  name,
  amount,
  currency,
  project,
  kind = "deposit",
}: {
  name: string | null;
  amount: number | null;
  currency: string | null;
  project?: string | null;
  kind?: "deposit" | "continuation" | "setup";
}) {
  const total = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency?.toUpperCase() || "USD",
  }).format((amount ?? 20_000) / 100);
  const greeting = name ? `Hola, ${escapeHtml(name)}.` : "Hola.";
  const label = project ? escapeHtml(project) : null;

  if (kind === "setup") {
    const sentence = `Recibimos tu pago de ${total} por la puesta en marcha. Te escribimos por WhatsApp para agendar la instalación.`;
    return {
      subject: "Recibimos el pago de tu puesta en marcha",
      text: `${greeting}\n\n${sentence}\n\nallok`,
      html: receiptHtml({ headline: "Tu agente ya está en camino.", body: `${greeting} ${sentence}`, lineItem: "Puesta en marcha", total }),
    };
  }

  const continuation = kind === "continuation";
  const baseLine = continuation ? "Continuación de proyecto" : "Depósito de inicio";
  const lineItem = label ? `${baseLine} — ${label}` : continuation ? baseLine : "Depósito de inicio de proyecto";
  const headline = continuation ? "Tu proyecto sigue en marcha." : "Tu proyecto ya está en marcha.";

  return {
    subject: continuation
      ? label
        ? `Seguimos con ${label}`
        : "Seguimos con tu proyecto en allok"
      : label
        ? `Tu proyecto ${label} con allok ya está en marcha`
        : "Tu proyecto con allok ya está en marcha",
    text: `${greeting}\n\nRecibimos tu pago de ${total}${label ? ` para ${label}` : ""}. ${continuation ? "Retomamos el trabajo y te contamos el avance del siguiente tramo." : "Nuestro equipo se pondrá en contacto para preparar la primera sesión de dirección."}\n\nallok`,
    html: receiptHtml({ headline, body: `${greeting} Recibimos tu pago${label ? ` para <strong>${label}</strong>` : ""}. ${continuation ? "Retomamos el trabajo y te contamos el avance del siguiente tramo." : "Nuestro equipo se pondrá en contacto contigo para preparar la primera sesión de dirección."}`, lineItem, total }),
  };
}
