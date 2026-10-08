import { outreachSecretCandidates, verifyUnsubscribeToken } from "@/lib/outreach";
import { ensureOutreachTables, outreachDbConfigured, suppressEmail } from "@/lib/outreach-db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * La baja de los correos en frío: `GET` (el enlace visible del correo) y
 * `POST` (el one-click de `List-Unsubscribe-Post`, RFC 8058). El token es el
 * correo firmado con el secreto de la prospección (`OUTREACH_SECRET` o el que
 * se deriva de `OPS_SESSION_SECRET`/`CRON_SECRET`; se acepta cualquiera, ver
 * `outreachSecretCandidates`); la página nunca lo muestra ni dice
 * nada más del contacto.
 */

const HEADERS = {
  "cache-control": "no-store",
  "x-robots-tag": "noindex, nofollow",
  "referrer-policy": "no-referrer",
};

function page(status: number, title: string, body: string): Response {
  const html = `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex"><title>${title} · allok</title>
<style>body{margin:0;font:16px/1.55 system-ui,-apple-system,sans-serif;background:#fafaf9;color:#1c1917}
main{max-width:32rem;margin:12vh auto;padding:0 16px}h1{font-size:1.4rem;margin:0 0 .5rem}p{margin:.5rem 0;color:#44403c}
a{color:inherit}@media (prefers-color-scheme:dark){body{background:#0c0a09;color:#f5f5f4}p{color:#d6d3d1}}</style></head>
<body><main><h1>${title}</h1>${body}<p><a href="https://allok.fun">allok.fun</a></p></main></body></html>`;
  return new Response(html, { status, headers: { ...HEADERS, "content-type": "text/html; charset=utf-8" } });
}

type Outcome = "ok" | "invalid" | "unavailable";

async function unsubscribe(request: Request): Promise<Outcome> {
  const secrets = outreachSecretCandidates(process.env);
  if (!secrets.length) return "unavailable";
  const token = new URL(request.url).searchParams.get("t");
  const email = secrets.map((secret) => verifyUnsubscribeToken(token, secret)).find(Boolean);
  if (!email) return "invalid";
  if (!outreachDbConfigured()) return "unavailable";
  try {
    await ensureOutreachTables();
    await suppressEmail({ email, reason: "unsubscribed", detail: { via: request.method === "POST" ? "one-click" : "link" } });
    return "ok";
  } catch (error) {
    console.error("Outreach unsubscribe failed", error);
    return "unavailable";
  }
}

export async function GET(request: Request) {
  const outcome = await unsubscribe(request);
  if (outcome === "ok") {
    return page(200, "Listo, no le volveremos a escribir", "<p>Su dirección quedó fuera de nuestra lista. No hace falta hacer nada más.</p>");
  }
  if (outcome === "invalid") {
    return page(400, "Este enlace no es válido", "<p>Puede que esté incompleto. Si quiere darse de baja, responda al correo con la palabra «baja» o escriba a hi@allok.fun.</p>");
  }
  return page(503, "No pudimos procesar la baja", "<p>Inténtelo de nuevo en unos minutos, o responda al correo con la palabra «baja» y lo hacemos a mano.</p>");
}

export async function POST(request: Request) {
  const outcome = await unsubscribe(request);
  const status = outcome === "ok" ? 200 : outcome === "invalid" ? 400 : 503;
  const text = outcome === "ok" ? "Baja registrada." : outcome === "invalid" ? "Enlace no válido." : "No disponible, intente más tarde.";
  return new Response(text, { status, headers: { ...HEADERS, "content-type": "text/plain; charset=utf-8" } });
}
