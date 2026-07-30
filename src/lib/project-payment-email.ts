function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character] ?? character);
}

export function projectPaymentEmail({
  name,
  amount,
  currency,
}: {
  name: string | null;
  amount: number | null;
  currency: string | null;
}) {
  const total = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency?.toUpperCase() || "USD",
  }).format((amount ?? 20_000) / 100);
  const greeting = name ? `Hola, ${escapeHtml(name)}.` : "Hola.";

  return {
    subject: "Tu proyecto con allok ya está en marcha",
    text: `${greeting}\n\nRecibimos tu depósito de ${total}. Nuestro equipo se pondrá en contacto para preparar la primera sesión de dirección.\n\nallok`,
    html: `<!doctype html><html lang="es"><body style="margin:0;background:#f1f1ef;color:#111;font-family:Arial,sans-serif"><main style="max-width:620px;margin:32px auto;background:#fff"><header style="padding:28px 36px;border-bottom:1px solid #e8e8e5;font-size:26px;font-weight:700;letter-spacing:-1px">allok</header><section style="padding:44px 36px"><p style="font:11px monospace;letter-spacing:1.5px;color:#777;text-transform:uppercase">Confirmación de pago</p><h1 style="font-size:34px;letter-spacing:-1.5px;margin:16px 0">Tu proyecto ya está en marcha.</h1><p style="color:#606060;line-height:1.6">${greeting} Recibimos tu depósito. Nuestro equipo se pondrá en contacto contigo para preparar la primera sesión de dirección.</p><table style="width:100%;margin:28px 0;border-collapse:collapse;border-top:1px solid #dededb;border-bottom:1px solid #dededb"><tr><td style="padding:18px 0">Depósito de inicio de proyecto</td><td style="padding:18px 0;text-align:right;font-weight:700">${total}</td></tr><tr><td style="padding:16px 0;border-top:1px solid #dededb;font-weight:700;font-size:18px">Total pagado</td><td style="padding:16px 0;border-top:1px solid #dededb;text-align:right;font-weight:700;font-size:18px">${total}</td></tr></table><p style="font-size:13px;color:#606060;line-height:1.6">¿Tienes una pregunta? Responde a este correo y te ayudamos.</p></section><footer style="padding:24px 36px;background:#f8f8f6;color:#777;font-size:12px;line-height:1.6">allok · Sistemas digitales para vender más y operar mejor</footer></main></body></html>`,
  };
}
