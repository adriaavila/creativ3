import { z } from "zod";
import { NextRequest, NextResponse } from "next/server";
import { getStripePurchaseBySessionId, type StripePurchase } from "@/lib/stripe-purchases-db";
import { getWahaConfig, getWahaSnapshot } from "@/lib/waha";
import {
  deleteWahaSession,
  ensureWahaSession,
  getWahaQr,
  logoutWahaSession,
  requestWahaPairingCode,
  restartWahaSession,
  startWahaSession,
  stopWahaSession,
} from "@/lib/waha-send";
import {
  getWahaConnection,
  updateWahaConnectionStatus,
  upsertWahaConnection,
  type WahaConnectionRecord,
} from "@/lib/whatsapp-inbox-db";

export const runtime = "nodejs";

const querySchema = z.object({ session_id: z.string().trim().min(10).max(255) });
const actionSchema = z.object({
  action: z.enum(["ensure", "start", "restart", "stop", "logout", "delete", "pair_code"]),
  phone: z.string().trim().optional(),
});
const ALLOWED_PLANS = new Set(["desk-cohort", "desk"]);

function wahaSessionIdFor(stripeSessionId: string, client: string | null): string {
  const source = client || stripeSessionId.slice(-24);
  const slug = source
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  return `cli-${slug || stripeSessionId.slice(-16).toLowerCase()}`;
}

async function authorize(req: NextRequest): Promise<
  | { purchase: StripePurchase; sessionId: string; workspaceId: string }
  | NextResponse
> {
  const parsed = querySchema.safeParse({ session_id: req.nextUrl.searchParams.get("session_id") });
  if (!parsed.success) return NextResponse.json({ error: "session_id requerido." }, { status: 400 });
  const purchase = await getStripePurchaseBySessionId(parsed.data.session_id).catch(() => null);
  if (!purchase) return NextResponse.json({ error: "Compra no encontrada." }, { status: 404 });
  if (purchase.channel !== "waha") {
    return NextResponse.json(
      { error: "Esta compra usa Cloud API — la activación va por /embedded-whatsapp.", channel: purchase.channel },
      { status: 409 },
    );
  }
  if (purchase.paymentStatus !== "paid" || !ALLOWED_PLANS.has(purchase.plan)) {
    return NextResponse.json({ error: "Esta compra no habilita una conexión WAHA." }, { status: 403 });
  }
  return {
    purchase,
    sessionId: wahaSessionIdFor(purchase.stripeSessionId, purchase.client),
    workspaceId: purchase.client?.trim() || `purchase:${purchase.id}`,
  };
}

function mapLiveStatus(value: string | null | undefined): WahaConnectionRecord["status"] {
  if (value === "connected") return "connected";
  if (value === "scan_qr") return "scan_qr";
  if (value === "passkey") return "passkey";
  if (value === "starting") return "starting";
  if (value === "stopped") return "stopped";
  if (value === "failed") return "failed";
  return "pending";
}

async function snapshot(sessionId: string, connection: WahaConnectionRecord | null, plan: string) {
  const live = (await getWahaSnapshot(sessionId)).sessions[0];
  const status = live ? mapLiveStatus(live.status) : connection?.status ?? "pending";
  if (connection && (status !== connection.status || live?.phone !== connection.phoneDisplay)) {
    await updateWahaConnectionStatus(sessionId, status, live?.phone);
  }
  const qr = status === "scan_qr" ? await getWahaQr(sessionId).catch(() => null) : null;
  return {
    connectionId: connection?.connectionId,
    session: sessionId,
    status,
    phone: live?.phone ?? connection?.phoneDisplay ?? null,
    engine: live?.engine ?? null,
    qr,
    plan,
  };
}

export async function GET(req: NextRequest) {
  const auth = await authorize(req);
  if (auth instanceof NextResponse) return auth;
  const connection = await getWahaConnection(auth.sessionId);
  return NextResponse.json(await snapshot(auth.sessionId, connection, auth.purchase.plan));
}

export async function POST(req: NextRequest) {
  const auth = await authorize(req);
  if (auth instanceof NextResponse) return auth;
  const parsed = actionSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Acción inválida." }, { status: 400 });

  const config = getWahaConfig();
  if (!config) return NextResponse.json({ error: "WAHA no está configurado." }, { status: 503 });

  let connection = await getWahaConnection(auth.sessionId);
  if (!connection && parsed.data.action !== "ensure") {
    return NextResponse.json({ error: "La conexión todavía no existe." }, { status: 409 });
  }

  try {
    switch (parsed.data.action) {
      case "ensure":
        connection = await upsertWahaConnection({
          id: auth.sessionId,
          workspaceId: auth.workspaceId,
          stripePurchaseId: auth.purchase.id,
          client: auth.purchase.client,
          wahaBaseUrl: config.baseUrl,
          status: "starting",
        });
        await ensureWahaSession(auth.sessionId, auth.workspaceId);
        break;
      case "start":
        await startWahaSession(auth.sessionId);
        await updateWahaConnectionStatus(auth.sessionId, "starting");
        break;
      case "restart":
        await ensureWahaSession(auth.sessionId, auth.workspaceId);
        await restartWahaSession(auth.sessionId);
        await updateWahaConnectionStatus(auth.sessionId, "starting");
        break;
      case "stop":
        await stopWahaSession(auth.sessionId);
        await updateWahaConnectionStatus(auth.sessionId, "stopped");
        break;
      case "logout":
        await logoutWahaSession(auth.sessionId);
        await updateWahaConnectionStatus(auth.sessionId, "stopped");
        break;
      case "delete":
        await deleteWahaSession(auth.sessionId);
        await updateWahaConnectionStatus(auth.sessionId, "deleted");
        return NextResponse.json({ connectionId: connection?.connectionId, session: auth.sessionId, status: "deleted" });
      case "pair_code": {
        const digits = (parsed.data.phone ?? "").replace(/\D/g, "");
        if (digits.length < 8 || digits.length > 15) {
          return NextResponse.json({ error: "Número inválido." }, { status: 400 });
        }
        const code = await requestWahaPairingCode(auth.sessionId, digits);
        return NextResponse.json({ connectionId: connection?.connectionId, session: auth.sessionId, status: "scan_qr", code });
      }
    }
    connection = await getWahaConnection(auth.sessionId);
    return NextResponse.json(await snapshot(auth.sessionId, connection, auth.purchase.plan));
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo actualizar la conexión WAHA.";
    if (connection) await updateWahaConnectionStatus(auth.sessionId, "failed", null, message).catch(() => null);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
