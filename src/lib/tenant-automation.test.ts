import assert from "node:assert/strict";
import test from "node:test";
import { automationRuntimePolicy, parseTenantAutomationInput } from "./tenant-automation";

test("operator can publish a normalized automation config for one Meta number", () => {
  assert.deepEqual(
    parseTenantAutomationInput({
      enabled: true,
      operatingMode: "approval",
      modelTier: "balanced",
      systemPrompt: "  Sos el asistente de Panadería Rosa.  ",
      businessFacts: "  Abrimos de 7 a 7.  ",
      handoffNote: "   ",
      autoReplies: {
        saludo: "  ¡Hola!  ",
        servicios: "",
        precio: "Desde 25 USD.",
        cita: "Dime qué día te conviene.",
      },
    }),
    {
      enabled: true,
      operatingMode: "approval",
      modelTier: "balanced",
      systemPrompt: "Sos el asistente de Panadería Rosa.",
      businessFacts: "Abrimos de 7 a 7.",
      handoffNote: null,
      autoReplies: {
        saludo: "¡Hola!",
        precio: "Desde 25 USD.",
        cita: "Dime qué día te conviene.",
      },
    },
  );
});

test("only an enabled automatic number may auto-assign and send rule replies", () => {
  const models = { fast: "provider/fast", capable: "provider/capable" };

  assert.deepEqual(
    automationRuntimePolicy({ enabled: true, operatingMode: "automatic", modelTier: "balanced" }, models),
    {
      autoAssignNewConversations: true,
      maySendRuleReplies: true,
      classifyModel: "provider/fast",
      replyModel: "provider/capable",
      fallbackModel: "provider/fast",
    },
  );
  assert.equal(
    automationRuntimePolicy({ enabled: true, operatingMode: "approval", modelTier: "fast" }, models).maySendRuleReplies,
    false,
  );
  assert.equal(
    automationRuntimePolicy({ enabled: false, operatingMode: "automatic", modelTier: "fast" }, models).autoAssignNewConversations,
    false,
  );
});

test("stored optional fields can round-trip through the save API as null", () => {
  const parsed = parseTenantAutomationInput({
    enabled: true,
    operatingMode: "approval",
    modelTier: "balanced",
    systemPrompt: null,
    businessFacts: null,
    handoffNote: null,
    autoReplies: {},
  });

  assert.equal(parsed.systemPrompt, null);
  assert.equal(parsed.businessFacts, null);
  assert.equal(parsed.handoffNote, null);
});
