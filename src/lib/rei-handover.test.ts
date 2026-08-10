import assert from "node:assert/strict";
import test from "node:test";
import { normalizeCrmWebhookUrl, parseReiOrganizationId } from "@/lib/handover/rei";

test("validates CRM handover identifiers and HTTPS callbacks", () => {
  assert.equal(
    parseReiOrganizationId(" 0f8fad5b-d9cb-469f-a165-70867728950e "),
    "0f8fad5b-d9cb-469f-a165-70867728950e",
  );
  assert.equal(parseReiOrganizationId("not-an-organization"), null);
  assert.equal(normalizeCrmWebhookUrl("https://crm.example.com/api/whatsapp/webhook"), "https://crm.example.com/api/whatsapp/webhook");
  assert.equal(normalizeCrmWebhookUrl("http://crm.example.com/webhook"), null);
});
