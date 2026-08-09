import { NextRequest, NextResponse } from "next/server";
import { authorizeOps } from "@/lib/ops-auth";
import { listClients, upsertClient } from "@/lib/clients-db";
import { parseClientInput } from "@/lib/clients";

export const dynamic = "force-dynamic";

export async function GET() {
  const authorization = await authorizeOps();
  if (!authorization.authorized) return authorization.response;

  try {
    return NextResponse.json({ clients: await listClients() });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "No se pudo leer el registro." },
      { status: 503 },
    );
  }
}

/** Alta y edición son el mismo upsert: el slug es la identidad del cliente. */
export async function POST(request: NextRequest) {
  const authorization = await authorizeOps();
  if (!authorization.authorized) return authorization.response;

  const body: unknown = await request.json().catch(() => null);
  const parsed = parseClientInput(body);
  if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });

  try {
    return NextResponse.json({ client: await upsertClient(parsed.input) });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "No se pudo guardar el cliente." },
      { status: 503 },
    );
  }
}
