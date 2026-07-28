import { authorizeOps } from "@/lib/ops-auth";
import { getWahaSnapshot } from "@/lib/waha";
import { getWahaQr } from "@/lib/waha-send";
import { getWahaConnection, updateWahaConnectionStatus } from "@/lib/whatsapp-inbox-db";

export const runtime = "nodejs";

/** Polling endpoint for the QR-pairing UI — refreshes our stored status against WAHA's live session state. */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const authorization = await authorizeOps();
  if (!authorization.authorized) return authorization.response;

  const { id } = await params;
  const connection = await getWahaConnection(id);
  if (!connection) {
    return Response.json({ error: "Sesión WAHA no encontrada." }, { status: 404 });
  }

  const snapshot = await getWahaSnapshot(id);
  const live = snapshot.sessions.find((session) => session.name === id);
  const liveStatus = live?.status?.toUpperCase();

  let status = connection.status;
  if (liveStatus === "WORKING") status = "connected";
  else if (liveStatus === "SCAN_QR_CODE") status = "scan_qr";
  else if (liveStatus === "STOPPED" || liveStatus === "FAILED") status = "disconnected";

  if (status !== connection.status) {
    await updateWahaConnectionStatus(id, status, live?.name ? connection.phoneDisplay : undefined);
  }

  const qr = status === "scan_qr" ? await getWahaQr(id).catch(() => null) : null;

  return Response.json({ connection: { ...connection, status }, qr });
}
