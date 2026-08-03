import type { CrmChannel } from "@/lib/crm-types";
import type { WahaConnectionRecord } from "@/lib/whatsapp-inbox-db";
import type { WhatsAppConnectionView } from "@/lib/whatsapp-connections-db";

const ACTIVE_STATUSES = new Set(["connected", "subscribed"]);

export function isCrmChannelActive(channel: Pick<CrmChannel, "status">) {
  return ACTIVE_STATUSES.has(channel.status.toLowerCase());
}

export function crmChannelStatusLabel(channel: Pick<CrmChannel, "status" | "official">) {
  const status = channel.status.toLowerCase();
  if (isCrmChannelActive(channel)) return "Operativo";
  if (["pending", "starting", "scan_qr", "passkey"].includes(status)) return "Configurando";
  if (["failed", "error"].includes(status)) return "Requiere atención";
  if (["deauthorized", "stopped", "deleted", "disconnected"].includes(status)) return "Desconectado";
  return channel.official ? "Estado no disponible" : "No disponible";
}

export function crmQualityLabel(value: string | null) {
  if (!value) return "No disponible";
  return value
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/(^|\s)\S/g, (letter) => letter.toUpperCase());
}

export function crmNameStatusLabel(value: string | null) {
  if (!value) return "No disponible";
  const normalized = value.toLowerCase();
  if (["approved", "verified", "verified_name"].includes(normalized)) return "Verificado";
  if (["pending", "in_review"].includes(normalized)) return "En revisión";
  if (["rejected", "declined"].includes(normalized)) return "Requiere atención";
  return crmQualityLabel(value);
}

export function buildCrmChannels(
  meta: WhatsAppConnectionView[],
  waha: WahaConnectionRecord[],
): CrmChannel[] {
  return [
    ...meta.map((connection): CrmChannel => ({
      id: connection.phoneNumberId,
      channel: "cloud_api",
      official: true,
      label: connection.displayPhoneNumber ?? connection.verifiedName ?? "WhatsApp oficial",
      phone: connection.displayPhoneNumber,
      status: connection.status,
      detail: connection.connectionMode === "META_COEXISTENCE" ? "Coexistencia oficial" : "Meta Cloud API",
      qualityRating: connection.qualityRating,
      nameStatus: connection.nameStatus,
      lastSyncedAt: connection.lastSyncedAt,
      workspace: connection.client,
      botConfigured: connection.botConfigured,
      automationEnabled: connection.automationEnabled,
      operatingMode: connection.operatingMode,
      modelTier: connection.modelTier,
    })),
    ...waha.map((connection): CrmChannel => ({
      id: connection.wahaSessionId,
      channel: "waha",
      official: false,
      label: connection.phoneDisplay ?? connection.wahaSessionId,
      phone: connection.phoneDisplay,
      status: connection.status,
      detail: "WAHA · no oficial",
      lastSyncedAt: connection.lastSyncedAt,
    })),
  ].sort((left, right) => Number(right.official) - Number(left.official));
}
