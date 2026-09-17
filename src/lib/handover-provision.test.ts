import assert from "node:assert/strict";
import test from "node:test";
import { runProvisionSmokeTest } from "@/lib/handover/provision";

test("el smoke test usa el secreto de provisión y la referencia del tenant", async () => {
  const originalFetch = globalThis.fetch;
  let capturedRequest: Request | undefined;
  globalThis.fetch = async (input, init) => {
    capturedRequest = new Request(input, init);
    return Response.json({ ok: true });
  };
  try {
    const result = await runProvisionSmokeTest({
      url: "https://vocero.test/api/provision/smoke-test",
      secret: "secret-for-provision",
      externalRef: "org-42",
    });
    assert.deepEqual(result, { ok: true });
    assert.ok(capturedRequest);
    assert.equal(capturedRequest.headers.get("authorization"), "Bearer secret-for-provision");
    assert.deepEqual(await capturedRequest.json(), { organization_id: "org-42" });
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("el smoke test conserva el error del destino", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => Response.json({ message: "WHATSAPP_SMOKE_TEST_TO no está configurado." }, { status: 503 });
  try {
    assert.deepEqual(
      await runProvisionSmokeTest({ url: "https://vocero.test/api/provision/smoke-test", secret: "secret", externalRef: null }),
      { ok: false, error: "WHATSAPP_SMOKE_TEST_TO no está configurado.", status: 503 },
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});
