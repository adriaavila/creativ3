import assert from "node:assert/strict";
import { WahaWhatsAppProvider } from "../src/lib/waha-provider";
import { readWahaQrResponse } from "../src/lib/waha-send";

const provider = new WahaWhatsAppProvider(async () => null);
const [event] = provider.normalizeWebhook({
  event: "message",
  session: "cli-mistica",
  payload: {
    id: "m1",
    fromMe: true,
    from: "59170000000@c.us",
    to: "59171111111@c.us",
    body: "Hola",
  },
});
assert.equal(event?.provider, "WAHA");
assert.equal(event?.type, "message.received");
if (event?.type === "message.received") {
  assert.equal(event.message.from, "59171111111");
  assert.equal(event.message.direction, "outbound");
}

void (async () => {
  const png = await readWahaQrResponse(new Response(new Uint8Array([137, 80, 78, 71]), {
    headers: { "content-type": "image/png" },
  }));
  assert.deepEqual(png, { mimetype: "image/png", data: "iVBORw==" });

  const json = await readWahaQrResponse(Response.json({ mimetype: "image/png", data: "abc" }));
  assert.deepEqual(json, { mimetype: "image/png", data: "abc" });
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
