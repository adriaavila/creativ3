// Dispara un mensaje entrante falso contra el webhook, firmado con META_APP_SECRET
// como lo firma Meta. Sirve para probar el agente sin pagar un anuncio ni tocar
// un teléfono real.
//
//   META_APP_SECRET=... node scripts/fake-ad-click.mjs <phone_number_id> [origen] [texto]
//
// origen: ad (default) | web
//   ad  -> incluye `referral`, como un click en un anuncio Click-to-WhatsApp.
//   web -> sin referral, como un wa.me desde el sitio.
import { createHmac, randomUUID } from "node:crypto";

const [phoneNumberId, origin = "ad", ...rest] = process.argv.slice(2);
const text = rest.join(" ") || "Hola me interesan los servicios";
const url = process.env.WEBHOOK_URL ?? "http://localhost:3000/api/meta/whatsapp/webhook";
const secret = process.env.META_APP_SECRET;
const from = process.env.FAKE_FROM ?? "584140000000";

if (!phoneNumberId) throw new Error("usage: fake-ad-click.mjs <phone_number_id> [ad|web] [texto]");
if (!secret) throw new Error("META_APP_SECRET is required (el webhook rechaza firmas inválidas)");
if (origin !== "ad" && origin !== "web") throw new Error(`origen inválido: ${origin} (usá ad o web)`);

// ponytail: referral fijo de un anuncio de prueba; parametrizar cuando haya más
// de una campaña que distinguir.
const referral = origin === "ad"
  ? {
      referral: {
        source_url: "https://fb.me/testad",
        source_id: process.env.FAKE_AD_ID ?? "120210000000000000",
        source_type: "ad",
        headline: "Automatizá tu WhatsApp",
        body: "Respondé en segundos",
        media_type: "image",
        ctwa_clid: `TEST${randomUUID().slice(0, 12)}`,
      },
    }
  : {};

const payload = {
  object: "whatsapp_business_account",
  entry: [{
    id: process.env.FAKE_WABA_ID ?? "000000000000000",
    changes: [{
      field: "messages",
      value: {
        messaging_product: "whatsapp",
        metadata: { display_phone_number: from, phone_number_id: phoneNumberId },
        contacts: [{ profile: { name: "Prueba Anuncio" }, wa_id: from }],
        messages: [{
          from,
          id: `wamid.FAKE${randomUUID().replaceAll("-", "").toUpperCase()}`,
          timestamp: String(Math.floor(Date.now() / 1000)),
          type: "text",
          text: { body: text },
          ...referral,
        }],
      },
    }],
  }],
};

const rawBody = JSON.stringify(payload);
const response = await fetch(url, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-hub-signature-256": `sha256=${createHmac("sha256", secret).update(rawBody).digest("hex")}`,
  },
  body: rawBody,
});

console.log(response.status, await response.text());
console.log(`origen=${origin} texto=${JSON.stringify(text)} de=${from}`);
