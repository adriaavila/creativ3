import type { CrmChannel } from "@/lib/crm-types";
import type { WhatsAppConnectionView } from "@/lib/whatsapp-connections-db";

const ACTIVE_STATUSES = new Set(["connected", "subscribed", "coexistence_sync_requested"]);

export function isCrmChannelActive(channel: Pick<CrmChannel, "status">) {
  return ACTIVE_STATUSES.has(channel.status.toLowerCase());
}

export function crmChannelStatusLabel(channel: Pick<CrmChannel, "status" | "official">) {
  const status = channel.status.toLowerCase();
  if (isCrmChannelActive(channel)) return "Operativo";
  if (["coexistence_sync_requested_unverified", "coexistence_sync_action_required"].includes(status)) {
    return "Requiere atención";
  }
  if (["pending", "starting", "scan_qr", "passkey"].includes(status)) return "Configurando";
  if (["failed", "error"].includes(status)) return "Requiere atención";
  if (["deauthorized", "stopped", "deleted", "disconnected"].includes(status)) return "Desconectado";
  return channel.official ? "Estado no disponible" : "No disponible";
}

export function crmQualityLabel(value: string | null) {
  if (!value) return "No disponible";
  if (value.toUpperCase() === "GREEN") return "Saludable";
  if (value.toUpperCase() === "YELLOW") return "En observación";
  if (value.toUpperCase() === "RED") return "Limitada";
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

export function crmChannelNextStep(channel: Pick<CrmChannel, "status" | "businessTokenStored" | "crmConnectedAt" | "crmOrganizationName">) {
  if (!isCrmChannelActive(channel)) return { label: "Requiere atención", detail: "Revisa la conexión con Meta antes de continuar.", action: "Revisar conexión" };
  if (!channel.businessTokenStored) return { label: "Falta el token", detail: "Repite el onboarding para recuperar una credencial válida.", action: "Completar onboarding" };
  if (channel.crmConnectedAt) return { label: `En ${channel.crmOrganizationName ?? "CRM externo"}`, detail: "El webhook está entregado. Haz una prueba desde el CRM.", action: "Revisar entrega" };
  // allok ya no atiende conversaciones: el único próximo paso posible es
  // entregar el número al CRM donde el cliente trabaja.
  return { label: "Listo para entregar", detail: "Entrega el número al CRM donde lo va a trabajar el cliente.", action: "Entregar número" };
}

/** Sólo Cloud API: WAHA se retiró de allok junto con la bandeja. */
export function buildCrmChannels(meta: WhatsAppConnectionView[]): CrmChannel[] {
  return [
    ...meta.map((connection): CrmChannel => ({
      id: connection.phoneNumberId,
      channel: "cloud_api",
      official: true,
      label: connection.displayPhoneNumber ?? connection.verifiedName ?? "WhatsApp oficial",
      phone: connection.displayPhoneNumber,
      status: connection.status,
      detail: connection.connectionMode === "META_COEXISTENCE" ? "Coexistencia oficial" : "Meta Cloud API",
      connectionMode: connection.connectionMode,
      wabaId: connection.wabaId,
      businessId: connection.businessId,
      verifiedName: connection.verifiedName,
      connectedAt: connection.connectedAt,
      qualityRating: connection.qualityRating,
      nameStatus: connection.nameStatus,
      lastSyncedAt: connection.lastSyncedAt,
      workspace: connection.client,
      businessTokenStored: connection.businessTokenStored,
      webhookOverrideUri: connection.webhookOverrideUri,
      crmOrganizationId: connection.crmOrganizationId,
      crmOrganizationName: connection.crmOrganizationName,
      crmProvider: connection.crmProvider,
      crmConnectedAt: connection.crmConnectedAt,
      botConfigured: connection.botConfigured,
      automationEnabled: connection.automationEnabled,
      operatingMode: connection.operatingMode,
      modelTier: connection.modelTier,
    })),
  ].sort((left, right) => Number(right.official) - Number(left.official));
}
