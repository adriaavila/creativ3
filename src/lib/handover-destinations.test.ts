import assert from "node:assert/strict";
import test from "node:test";
import {
  matchesDestinationSubscription,
  normalizeWebhookUrl,
  parseDestinationInput,
  parseExternalRef,
} from "@/lib/handover/destinations";

test("confirma el callback aunque Meta omita el app id", () => {
  const webhook = "https://vocero.app/api/whatsapp/webhook";
  assert.equal(matchesDestinationSubscription({ override_callback_uri: webhook }, "app-1", webhook), true);
  assert.equal(matchesDestinationSubscription({ id: "otra", override_callback_uri: webhook }, "app-1", webhook), false);
  assert.equal(matchesDestinationSubscription({ override_callback_uri: "https://otra.app/hook" }, "app-1", webhook), false);
});

test("un destino necesita slug, nombre, webhook HTTPS y verify token", () => {
  const parsed = parseDestinationInput({
    slug: " Vocero ",
    label: "  Vocero CRM  ",
    webhook_url: "https://vocero.app/api/whatsapp/webhook",
    verify_token: "  vocero-verify-123  ",
  });
  assert.deepEqual("error" in parsed ? parsed.error : parsed.input, {
    slug: "vocero",
    label: "Vocero CRM",
    webhookUrl: "https://vocero.app/api/whatsapp/webhook",
    verifyToken: "vocero-verify-123",
    provisionUrl: null,
    provisionSecret: null,
  });
});

test("Meta manda el verify token como query param, así que se rechaza lo que rompe el handshake", () => {
  // Un webhook http o un token con espacios pasan la validación local y fallan
  // recién en Meta, con el número ya a mitad de camino.
  const base = { slug: "vocero", label: "Vocero", verify_token: "vocero-verify-123" };
  assert.ok("error" in parseDestinationInput({ ...base, webhook_url: "http://vocero.app/hook" }));
  assert.ok("error" in parseDestinationInput({ ...base, webhook_url: "https://vocero.app/hook", verify_token: "con espacios" }));
  assert.ok("error" in parseDestinationInput({ ...base, webhook_url: "https://vocero.app/hook", verify_token: "corto" }));
  assert.equal(normalizeWebhookUrl("http://vocero.app/hook"), null);
});

test("un destino con provisión no se guarda sin su secreto", () => {
  // Guardarlo a medias deja una entrega que empuja credenciales sin
  // autenticarse: la app destino la rechaza y el operador ve un 401 opaco.
  const base = {
    slug: "vocero",
    label: "Vocero",
    webhook_url: "https://vocero.app/api/whatsapp/webhook",
    verify_token: "vocero-verify-123",
  };
  assert.ok("error" in parseDestinationInput({ ...base, provision_url: "https://vocero.app/api/whatsapp/provision" }));

  const conSecreto = parseDestinationInput({
    ...base,
    provision_url: "https://vocero.app/api/whatsapp/provision",
    provision_secret: "  secreto  ",
  });
  assert.equal("error" in conSecreto ? null : conSecreto.input.provisionSecret, "secreto");
});

test("la referencia externa es opaca pero acotada", () => {
  assert.equal(parseExternalRef(" 0f8fad5b-d9cb-469f-a165-70867728950e "), "0f8fad5b-d9cb-469f-a165-70867728950e");
  assert.equal(parseExternalRef("org:42"), "org:42");
  assert.equal(parseExternalRef("con espacios"), null);
  assert.equal(parseExternalRef("x".repeat(81)), null);
});
