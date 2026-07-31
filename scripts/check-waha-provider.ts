import assert from "node:assert/strict";
import { WahaWhatsAppProvider } from "../src/lib/waha-provider";

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
