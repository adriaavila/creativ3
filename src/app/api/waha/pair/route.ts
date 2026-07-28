import { z } from "zod";
import { NextRequest, NextResponse } from "next/server";
import { getStripePurchaseBySessionId } from "@/lib/stripe-purchases-db";
import { getWahaConfig, getWahaSnapshot } from "@/lib/waha";
import { getWahaQr, startWahaSession } from "@/lib/waha-send";
import { getWahaConnection, updateWahaConnectionStatus, upsertWahaConnection } from "@/lib/whatsapp-inbox-db";

export const runtime = "nodejs";

// Self-serve WAHA pairing for a paying customer. Authorization is the Stripe
// checkout session id itself: unguessable, issued by Stripe, and only the buyer
// receives it (via the success_url). No ops cookie needed here, and no way to
// enumerate other customers' sessions.
const querySchema = z.object({ session_id: z.string().trim().min(10).max(255) });

/** Derives a stable, slug-safe WAHA session name from the purchase. */
function wahaSessionIdFor(stripeSessionId: string, client: string | null): string {
  if (client) {
    const slug = client
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40);
    if (slug) return slug;
  }
  // Stripe ids are `cs_live_...`; the tail is unique and already slug-safe.
  return `cli-${stripeSessionId.slice(-24).toLowerCase().replace(/[^a-z0-9]/g, "")}`;
}

export async function GET(req: NextRequest) {
  const parsed = querySchema.safeParse({ session_id: req.nextUrl.searchParams.get("session_id") });
  if (!parsed.success) {
    return NextResponse.json({ error: "session_id requerido." }, { status: 400 });
  }

  const purchase = await getStripePurchaseBySessionId(parsed.data.session_id).catch(() => null);
  if (!purchase) {
    return NextResponse.json({ error: "Compra no encontrada." }, { status: 404 });
  }
  if (purchase.channel !== "waha") {
    return NextResponse.json(
      { error: "Esta compra usa Cloud API — la activación va por /embedded-whatsapp.", channel: purchase.channel },
      { status: 409 },
    );
  }

  const config = getWahaConfig();
  if (!config) {
    return NextResponse.json({ error: "WAHA no está configurado." }, { status: 503 });
  }

  const sessionId = wahaSessionIdFor(purchase.stripeSessionId, purchase.client);

  let connection = await getWahaConnection(sessionId);
  if (!connection) {
    await upsertWahaConnection({
      id: sessionId,
      client: purchase.client,
      wahaBaseUrl: config.baseUrl,
      status: "pending",
    });
    try {
      await startWahaSession(sessionId);
      await updateWahaConnectionStatus(sessionId, "scan_qr");
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "No se pudo iniciar la sesión WAHA." },
        { status: 502 },
      );
    }
    connection = await getWahaConnection(sessionId);
  }

  // Reconcile stored status against WAHA's live view so the page can stop polling.
  const snapshot = await getWahaSnapshot(sessionId);
  const liveStatus = snapshot.sessions.find((s) => s.name === sessionId)?.status?.toUpperCase();
  let status = connection?.status ?? "pending";
  if (liveStatus === "WORKING") status = "connected";
  else if (liveStatus === "SCAN_QR_CODE") status = "scan_qr";
  else if (liveStatus === "STOPPED" || liveStatus === "FAILED") status = "disconnected";

  if (connection && status !== connection.status) {
    await updateWahaConnectionStatus(sessionId, status);
  }

  const qr = status === "scan_qr" ? await getWahaQr(sessionId).catch(() => null) : null;

  return NextResponse.json({ session: sessionId, status, qr, plan: purchase.plan });
}
