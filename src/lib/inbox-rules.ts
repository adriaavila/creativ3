import type { WaConversation } from "@/lib/whatsapp-inbox-db";
import { normalizeWhatsAppPhone } from "@/lib/phone";

export const ACTIVE_REPLY_WINDOW_MS = 7 * 24 * 60 * 60 * 1_000;

export function isWaitingForReply(conversation: WaConversation, now = Date.now()) {
  if (
    conversation.status !== "open" ||
    conversation.assignedMode !== "human" ||
    !conversation.lastInboundAt ||
    conversation.lastMessageAt !== conversation.lastInboundAt
  ) return false;
  const receivedAt = Date.parse(conversation.lastInboundAt);
  return Number.isFinite(receivedAt) && now - receivedAt <= ACTIVE_REPLY_WINDOW_MS;
}

export type ConversationGroup = {
  key: string;
  primary: WaConversation;
  conversations: WaConversation[];
};

export function groupConversations(
  conversations: WaConversation[],
  selectedId: number | null = null,
): ConversationGroup[] {
  const groups = new Map<string, WaConversation[]>();
  for (const conversation of conversations) {
    const phone = normalizeWhatsAppPhone(conversation.contactPhone || conversation.contactWaId);
    // ponytail: old Meta rows use `<slug>-ops-owner` while WAHA uses `<slug>`.
    // Replace this alias with an explicit connection mapping if tenant aliases grow.
    const workspace = (conversation.workspaceKey ?? `${conversation.channelKind}:${conversation.channelKey}`)
      .replace(/-ops-owner$/, "");
    const key = phone ? `${workspace}:${phone}` : `${workspace}:${conversation.contactWaId}`;
    groups.set(key, [...(groups.get(key) ?? []), conversation]);
  }

  return [...groups.entries()].map(([key, items]) => {
    const ordered = items.sort(compareActivity);
    return {
      key,
      primary: ordered.find(({ id }) => id === selectedId) ?? ordered[0],
      conversations: ordered,
    };
  }).sort((left, right) => compareActivity(left.primary, right.primary));
}

function compareActivity(left: WaConversation, right: WaConversation) {
  const byDate = String(right.lastMessageAt ?? right.updatedAt)
    .localeCompare(String(left.lastMessageAt ?? left.updatedAt));
  if (byDate !== 0) return byDate;
  return Number(right.channelKind === "cloud_api") - Number(left.channelKind === "cloud_api");
}
