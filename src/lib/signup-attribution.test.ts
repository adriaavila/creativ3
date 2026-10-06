import { test } from "node:test";
import assert from "node:assert/strict";
import { CRM_APP_URL, registerUrl } from "./plans";
import {
  buildFirstTouch,
  externalReferrerHost,
  isRegisterHref,
  mergeIntoRegisterUrl,
  parseStoredOrigen,
  pickAttribution,
} from "./signup-attribution";

test("solo se toman los parámetros de la lista blanca", () => {
  const picked = pickAttribution("?utm_source=ig&utm_campaign=q4&foo=bar&gclid=G1&ref=&email=x@y.z");
  assert.deepEqual(picked, { utm_source: "ig", utm_campaign: "q4", gclid: "G1" });
});

test("valores largos se recortan", () => {
  const picked = pickAttribution(`utm_content=${"a".repeat(500)}`);
  assert.equal(picked.utm_content?.length, 200);
});

test("el referrer cuenta solo si es de fuera de allok.fun", () => {
  assert.equal(externalReferrerHost("https://www.google.com/search?q=x"), "www.google.com");
  assert.equal(externalReferrerHost("https://allok.fun/rei"), undefined);
  assert.equal(externalReferrerHost("https://whatsapp.allok.fun/login"), undefined);
  assert.equal(externalReferrerHost("http://localhost:3000/", "localhost"), undefined);
  assert.equal(externalReferrerHost(""), undefined);
  assert.equal(externalReferrerHost("not a url"), undefined);
});

test("el primer toque nace solo con parámetros en la URL", () => {
  assert.equal(buildFirstTouch({ search: "", pathname: "/", referrer: "https://l.instagram.com/" }), null);
  assert.deepEqual(
    buildFirstTouch({ search: "?utm_source=fb&fbclid=F", pathname: "/rei", referrer: "https://l.facebook.com/" }),
    { utm_source: "fb", fbclid: "F", landing: "/rei", referrer: "l.facebook.com" },
  );
});

test("lo guardado se lee sin confiar en ello", () => {
  assert.deepEqual(parseStoredOrigen(null), {});
  assert.deepEqual(parseStoredOrigen("{roto"), {});
  assert.deepEqual(parseStoredOrigen("[1,2]"), {});
  assert.deepEqual(parseStoredOrigen(JSON.stringify({ utm_source: "x", evil: "y", landing: 3 })), { utm_source: "x" });
});

test("solo los enlaces al registro del CRM se reconocen", () => {
  assert.ok(isRegisterHref(`${CRM_APP_URL}/register`));
  assert.ok(isRegisterHref(`${CRM_APP_URL}/register?plan=pro`));
  assert.ok(!isRegisterHref(`${CRM_APP_URL}/registered`));
  assert.ok(!isRegisterHref(`${CRM_APP_URL}/login`));
  assert.ok(!isRegisterHref("https://evil.example/register"));
});

test("el origen se agrega sin pisar lo que el enlace ya trae", () => {
  const merged = new URL(
    mergeIntoRegisterUrl(`${CRM_APP_URL}/register?plan=pro&utm_source=manual`, {
      utm_source: "test",
      utm_campaign: "q4",
      landing: "/",
      referrer: "www.google.com",
    }),
  );
  assert.equal(merged.origin + merged.pathname, `${CRM_APP_URL}/register`);
  assert.equal(merged.searchParams.get("plan"), "pro");
  assert.equal(merged.searchParams.get("utm_source"), "manual");
  assert.equal(merged.searchParams.get("utm_campaign"), "q4");
  assert.equal(merged.searchParams.get("landing"), "/");
  assert.equal(merged.searchParams.get("referrer"), "www.google.com");
});

test("el botón de Completo conserva plan=pro y pagar=1 al sumar el origen", () => {
  const merged = new URL(
    mergeIntoRegisterUrl(registerUrl("pro", { payNow: true }), { utm_source: "meta", fbclid: "abc", landing: "/" }),
  );
  assert.equal(merged.searchParams.get("plan"), "pro");
  assert.equal(merged.searchParams.get("pagar"), "1");
  assert.equal(merged.searchParams.get("utm_source"), "meta");
  assert.equal(merged.searchParams.get("fbclid"), "abc");
});

test("un enlace que no es el registro no se toca", () => {
  const href = `${CRM_APP_URL}/login`;
  assert.equal(mergeIntoRegisterUrl(href, { utm_source: "x" }), href);
});
