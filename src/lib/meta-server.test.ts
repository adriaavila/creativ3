import assert from "node:assert/strict";
import test from "node:test";
import {
  createMetaOnboardingInvite,
  createMetaSignupState,
  verifyMetaOnboardingInvite,
  verifyMetaSignupState,
} from "@/lib/meta/server";

test("el enlace SaaS queda firmado, ligado al tenant y a Vocero", () => {
  const secret = "x".repeat(32);
  const invite = createMetaOnboardingInvite("org-123", "META_COEXISTENCE", secret, "vocero");
  assert.ok(invite);
  const parsed = verifyMetaOnboardingInvite(invite, secret);
  assert.equal(parsed?.purpose, "meta_onboarding_invite");
  assert.equal(parsed?.workspace, "org-123");
  assert.equal(parsed?.connection_mode, "META_COEXISTENCE");
  assert.equal(parsed?.destination, "vocero");
  assert.ok(parsed?.nonce);
});

test("el estado de Meta conserva el destino, pero no acepta alteraciones", () => {
  const secret = "x".repeat(32);
  const previous = process.env.META_APP_SECRET;
  process.env.META_APP_SECRET = secret;
  try {
    const state = createMetaSignupState("org-123", "META_COEXISTENCE", "vocero");
    assert.ok(state);
    const parsed = verifyMetaSignupState(state, secret);
    assert.equal(parsed?.destination, "vocero");
  } finally {
    if (previous === undefined) delete process.env.META_APP_SECRET;
    else process.env.META_APP_SECRET = previous;
  }
});

test("el enlace firmado conserva destinos dedicados y la referencia SaaS", () => {
  const secret = "x".repeat(32);
  const invite = createMetaOnboardingInvite(
    "cliente-rei",
    "META_COEXISTENCE",
    secret,
    "rei-saas",
    "https://rei.allok.fun/settings/whatsapp",
    "org:42",
  );
  assert.ok(invite);
  const parsed = verifyMetaOnboardingInvite(invite, secret);
  assert.equal(parsed?.destination, "rei-saas");
  assert.equal(parsed?.external_ref, "org:42");
  assert.equal(parsed?.return_url, "https://rei.allok.fun/settings/whatsapp");
});

test("un destino con referencia dedicada puede firmarse sin external_ref", () => {
  const secret = "x".repeat(32);
  const invite = createMetaOnboardingInvite("mistica", "META_COEXISTENCE", secret, "mistica", undefined, null);
  assert.ok(invite);
  const parsed = verifyMetaOnboardingInvite(invite, secret);
  assert.equal(parsed?.destination, "mistica");
  assert.equal(parsed?.external_ref, null);
});
