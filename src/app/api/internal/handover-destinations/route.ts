import { NextRequest, NextResponse } from "next/server";
import { bearerMatches } from "@/lib/handover/bearer";
import { parseDestinationInput, upsertDestination } from "@/lib/handover/destinations";

export const dynamic = "force-dynamic";

/** Máquina-a-máquina para que alta-vocero.sh registre destinos idempotentes. */
export async function POST(request: NextRequest) {
  if (!bearerMatches(
    request.headers.get("authorization"),
    process.env.ALLOK_DESTINATION_SYNC_SECRET?.trim(),
  )) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const parsed = parseDestinationInput(await request.json().catch(() => null));
  if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });

  try {
    return NextResponse.json({ destination: await upsertDestination(parsed.input) });
  } catch {
    return NextResponse.json({ error: "No se pudo registrar el destino." }, { status: 503 });
  }
}
