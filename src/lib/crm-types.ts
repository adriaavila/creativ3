import type { ChannelKind } from "@/lib/whatsapp-inbox-db";

export type CrmChannel = {
  id: string;
  channel: ChannelKind;
  official: boolean;
  label: string;
  phone: string | null;
  status: string;
  detail: string;
  qualityRating?: string | null;
  nameStatus?: string | null;
  lastSyncedAt?: string | null;
  /** Owning workspace (whatsapp_connections.client). Sent back on template/outreach
   *  calls so the server scopes the connection lookup to the right tenant. */
  workspace?: string | null;
};
