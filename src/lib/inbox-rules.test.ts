import assert from "node:assert/strict";
import test from "node:test";
import { groupConversations, isWaitingForReply } from "./inbox-rules";
import type { WaConversation } from "./whatsapp-inbox-db";

const NOW = Date.parse("2026-08-10T12:00:00.000Z");

function conversation(input: Partial<WaConversation> & Pick<WaConversation, "id" | "channelKind">): WaConversation {
  const { id, channelKind, ...overrides } = input;
  return {
    id,
    workspaceKey: "allok-ops-owner",
    connectionId: null,
    leadId: null,
    channelKind,
    channelKey: channelKind === "cloud_api" ? "meta-1" : "allok-main",
    contactWaId: "584120000001",
    contactPhone: "584120000001",
    contactName: "Ana",
    status: "open",
    assignedMode: "human",
    outcome: null,
    outcomeAt: null,
    lastMessageAt: "2026-08-10T11:00:00.000Z",
    lastInboundAt: "2026-08-10T11:00:00.000Z",
    summary: null,
    createdAt: "2026-08-10T10:00:00.000Z",
    updatedAt: "2026-08-10T11:00:00.000Z",
    ...overrides,
  };
}

test("inbox groups the same phone across Meta and WAHA", () => {
  const grouped = groupConversations([
    conversation({ id: 1, channelKind: "cloud_api", workspaceKey: "allok-ops-owner" }),
    conversation({ id: 2, channelKind: "waha", workspaceKey: "allok", lastMessageAt: "2026-08-10T11:30:00.000Z" }),
  ]);
  assert.equal(grouped.length, 1);
  assert.equal(grouped[0].primary.id, 2);
  assert.equal(grouped[0].conversations.length, 2);
  assert.equal(groupConversations(grouped[0].conversations, 1)[0].primary.id, 1);
  assert.equal(groupConversations([
    conversation({ id: 3, channelKind: "cloud_api", workspaceKey: "cliente-a" }),
    conversation({ id: 4, channelKind: "waha", workspaceKey: "cliente-b" }),
  ]).length, 2);
});

test("pending replies are recent, open, human-owned inbound messages", () => {
  const pending = conversation({ id: 1, channelKind: "waha" });
  assert.equal(isWaitingForReply(pending, NOW), true);
  assert.equal(isWaitingForReply({ ...pending, assignedMode: "ai" }, NOW), false);
  assert.equal(isWaitingForReply({ ...pending, status: "closed" }, NOW), false);
  assert.equal(isWaitingForReply({ ...pending, lastInboundAt: "2026-08-01T11:00:00.000Z", lastMessageAt: "2026-08-01T11:00:00.000Z" }, NOW), false);
});
