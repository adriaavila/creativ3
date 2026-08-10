import type { ChannelKind } from "@/lib/whatsapp-inbox-db";
import type { AutomationMode, ModelTier } from "@/lib/tenant-automation";

export type CrmChannel = {
  id: string;
  channel: ChannelKind;
  official: boolean;
  label: string;
  phone: string | null;
  status: string;
  detail: string;
  connectionMode?: "META_CLOUD_API" | "META_COEXISTENCE";
  wabaId?: string | null;
  businessId?: string | null;
  verifiedName?: string | null;
  connectedAt?: string | null;
  qualityRating?: string | null;
  nameStatus?: string | null;
  lastSyncedAt?: string | null;
  /** Owning workspace (whatsapp_connections.client). Sent back on template/outreach
   *  calls so the server scopes the connection lookup to the right tenant. */
  workspace?: string | null;
  businessTokenStored?: boolean;
  webhookOverrideUri?: string | null;
  crmOrganizationId?: string | null;
  crmOrganizationName?: string | null;
  crmConnectedAt?: string | null;
  botConfigured?: boolean;
  automationEnabled?: boolean;
  operatingMode?: AutomationMode | null;
  modelTier?: ModelTier | null;
};
