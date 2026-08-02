import { authorizeOps } from "@/lib/ops-auth";

/**
 * Dispara el workflow "Sync portafolio" (.github/workflows/sync-projects.yml)
 * en vez de correr Playwright dentro de una función de Vercel: la Action ya
 * tiene chromium y gh listos, aqui solo hace falta el click.
 */
export async function POST(request: Request) {
  const authorization = await authorizeOps();
  if (!authorization.authorized) return authorization.response;

  const token = process.env.PORTFOLIO_SYNC_TOKEN;
  const repo = process.env.PORTFOLIO_SYNC_REPO || "adriaavila/creativ3";
  if (!token) {
    return Response.json(
      { error: "Falta PORTFOLIO_SYNC_TOKEN en las variables de entorno." },
      { status: 500 },
    );
  }

  const body = await request.json().catch(() => ({}));
  const ids: string[] = Array.isArray(body?.ids) ? body.ids.filter((id: unknown) => typeof id === "string") : [];

  const res = await fetch(
    `https://api.github.com/repos/${repo}/actions/workflows/sync-projects.yml/dispatches`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ref: "main", inputs: { ids: ids.join(" ") } }),
    },
  );

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    return Response.json(
      { error: `GitHub respondió ${res.status} al disparar el workflow.`, detail },
      { status: 502 },
    );
  }

  return Response.json({
    ok: true,
    runsUrl: `https://github.com/${repo}/actions/workflows/sync-projects.yml`,
  });
}
