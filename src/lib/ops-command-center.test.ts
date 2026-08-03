import assert from "node:assert/strict";
import test from "node:test";
import {
  caracasBusinessDate,
  classifyGrowthAction,
  crmLeadUrl,
  draftApprovalAction,
  growthDraftUrl,
  inboxConversationUrl,
  projectOpsCommandCenter,
  sortOpsActions,
  type OpsAction,
} from "@/lib/ops-command-center";

const action = (overrides: Partial<OpsAction>): OpsAction => ({
  id: "action",
  kind: "reply",
  severity: "high",
  title: "Responder",
  reason: "El cliente espera una respuesta.",
  occurredAt: "2026-08-01T12:00:00.000Z",
  href: "/ops/inbox?conversation=1",
  cta: "Responder",
  ...overrides,
});

test("critical incidents sort before waiting replies", () => {
  const sorted = sortOpsActions([
    action({ id: "reply" }),
    action({ id: "incident", kind: "incident", severity: "critical" }),
  ]);

  assert.deepEqual(sorted.map(({ id }) => id), ["incident", "reply"]);
});

test("waiting replies sort oldest first", () => {
  const sorted = sortOpsActions([
    action({ id: "newer", occurredAt: "2026-08-02T12:00:00.000Z" }),
    action({ id: "older", occurredAt: "2026-08-01T12:00:00.000Z" }),
  ]);

  assert.deepEqual(sorted.map(({ id }) => id), ["older", "newer"]);
});

test("scheduled follow-up uses the Caracas date at the UTC day boundary", () => {
  const beforeMidnight = new Date("2026-08-03T03:59:59.000Z");
  const afterMidnight = new Date("2026-08-03T04:00:00.000Z");
  const lead = {
    id: "00000000-0000-4000-8000-000000000001",
    businessName: "Acme",
    status: "contacted",
    nextAction: "Llamar",
    nextActionAt: "2026-08-03T00:00:00.000Z",
    lastContactedAt: "2026-08-02T20:00:00.000Z",
    createdAt: "2026-08-01T12:00:00.000Z",
  };

  assert.equal(caracasBusinessDate(beforeMidnight), "2026-08-02");
  assert.equal(classifyGrowthAction(lead, caracasBusinessDate(beforeMidnight), beforeMidnight), null);
  assert.equal(caracasBusinessDate(afterMidnight), "2026-08-03");
  assert.equal(classifyGrowthAction(lead, caracasBusinessDate(afterMidnight), afterMidnight)?.kind, "follow_up");
});

test("queue destinations open the exact Inbox, CRM, and Growth records", () => {
  const uuid = "00000000-0000-4000-8000-000000000001";
  assert.equal(inboxConversationUrl(42), "/ops/inbox?conversation=42");
  assert.equal(crmLeadUrl(uuid), `/ops/crm?lead=${uuid}`);
  assert.equal(growthDraftUrl(uuid), `/ops/growth?tab=drafts&draft=${uuid}`);
});

test("missing source data is unavailable, never a false zero", () => {
  const projection = projectOpsCommandCenter({
    businessDate: "2026-08-03",
    replies: undefined,
    followUps: { count: 0, actions: [] },
    approvals: { count: 2, actions: [] },
    incidents: { count: 0, actions: [] },
    pulse: { nextStepShare: null, citas: 0, weightedPipeline: null },
  });

  assert.equal(projection.counts.waitingReplies, null);
  assert.equal(projection.counts.dueFollowUps, 0);
  assert.equal(projection.counts.pendingApprovals, 2);
});

test("pending approval and proposal actions target their exact records", () => {
  const uuid = "00000000-0000-4000-8000-000000000001";
  const approval = draftApprovalAction({
    id: uuid,
    businessName: "Acme",
    updatedAt: "2026-08-01T12:00:00.000Z",
  });
  const proposal = classifyGrowthAction({
    id: uuid,
    businessName: "Acme",
    status: "replied",
    nextAction: null,
    nextActionAt: null,
    lastContactedAt: "2026-08-01T12:00:00.000Z",
    createdAt: "2026-07-30T12:00:00.000Z",
  }, "2026-08-03", new Date("2026-08-03T12:00:00.000Z"));

  assert.equal(approval.href, growthDraftUrl(uuid));
  assert.equal(proposal?.kind, "proposal");
  assert.equal(proposal?.href, crmLeadUrl(uuid));
});

test("queue is bounded while source counts remain complete", () => {
  const actions = Array.from({ length: 4 }, (_, index) => action({ id: `reply-${index}` }));
  const projection = projectOpsCommandCenter({
    businessDate: "2026-08-03",
    replies: { count: 40, actions },
    followUps: { count: 0, actions: [] },
    approvals: { count: 0, actions: [] },
    incidents: { count: 0, actions: [] },
    pulse: { nextStepShare: 50, citas: 2, weightedPipeline: 1_000 },
  }, 2);

  assert.equal(projection.actions.length, 2);
  assert.equal(projection.counts.waitingReplies, 40);
});
