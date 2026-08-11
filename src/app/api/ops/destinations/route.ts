import { authorizeOps } from "@/lib/ops-auth";
import { listDestinations, parseDestinationInput, upsertDestination } from "@/lib/handover/destinations";

export const dynamic = "force-dynamic";

/** Las apps a las que allok puede entregar un número. Nunca devuelve secretos. */
export async function GET() {
  const authorization = await authorizeOps();
  if (!authorization.authorized) return authorization.response;

  try {
    return Response.json({ destinations: await listDestinations() });
  } catch {
    return Response.json({ error: "No se pudieron leer los destinos." }, { status: 503 });
  }
}

export async function POST(request: Request) {
  const authorization = await authorizeOps();
  if (!authorization.authorized) return authorization.response;

  const parsed = parseDestinationInput(await request.json().catch(() => null));
  if ("error" in parsed) return Response.json({ error: parsed.error }, { status: 400 });

  try {
    // Reenviar el mismo slug reemplaza sus datos: rotar un verify token es
    // guardar el destino otra vez, sin tocar las conexiones ya entregadas.
    return Response.json({ destination: await upsertDestination(parsed.input) });
  } catch {
    return Response.json({ error: "No se pudo guardar el destino." }, { status: 503 });
  }
}
