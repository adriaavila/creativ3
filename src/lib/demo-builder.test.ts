import { test } from "node:test";
import assert from "node:assert/strict";
import { fetchHtml, isPrivateAddress, isPublicUrl } from "./demo-builder";
import { walledSite } from "./demo-self-serve";

test("isPrivateAddress: la red interna no se lee", () => {
  for (const ip of ["127.0.0.1", "10.1.2.3", "172.20.0.1", "192.168.1.10", "169.254.169.254", "0.0.0.0", "::1", "fd00::1", "::ffff:10.0.0.1", "100.64.0.1"]) {
    assert.equal(isPrivateAddress(ip), true, ip);
  }
  for (const ip of ["8.8.8.8", "172.32.0.1", "2606:4700::1111"]) assert.equal(isPrivateAddress(ip), false, ip);
});

test("isPublicUrl: solo http(s) públicos, sin credenciales ni puertos raros", async () => {
  const pub = async () => ["93.184.216.34"];
  assert.equal(await isPublicUrl(new URL("https://clinica.mx"), pub), true);
  assert.equal(await isPublicUrl(new URL("https://clinica.mx"), async () => ["10.0.0.5"]), false);
  assert.equal(await isPublicUrl(new URL("http://localhost/admin"), pub), false);
  assert.equal(await isPublicUrl(new URL("http://169.254.169.254/latest"), pub), false);
  assert.equal(await isPublicUrl(new URL("https://user:pw@clinica.mx"), pub), false);
  assert.equal(await isPublicUrl(new URL("https://clinica.mx:5432"), pub), false);
  assert.equal(await isPublicUrl(new URL("file:///etc/passwd"), pub), false);
});

test("fetchHtml: una redirección a la red interna se corta sin pedirla", async () => {
  const asked: string[] = [];
  const fake = (async (url: string) => {
    asked.push(url);
    return new Response(null, { status: 302, headers: { location: "http://127.0.0.1:3000/api/secret" } });
  }) as unknown as typeof fetch;
  const page = await fetchHtml("https://publica.ejemplo.com", { fetch: fake, resolve: async () => ["93.184.216.34"] });
  assert.equal(page, null);
  assert.deepEqual(asked, ["https://publica.ejemplo.com/"]);
});

test("fetchHtml: lee una página pública y sigue una redirección pública", async () => {
  const fake = (async (url: string) =>
    url.startsWith("https://clinica.mx")
      ? new Response(null, { status: 301, headers: { location: "https://www.clinica.mx/" } })
      : new Response("<html><body><h1>Limpieza $600</h1></body></html>", { headers: { "content-type": "text/html" } })) as unknown as typeof fetch;
  const page = await fetchHtml("https://clinica.mx", { fetch: fake, resolve: async () => ["93.184.216.34"] });
  assert.equal(page?.url, "https://www.clinica.mx/");
  assert.match(page?.html ?? "", /Limpieza \$600/);
});

test("walledSite: Instagram y compañía se dicen, no se intentan", () => {
  assert.equal(walledSite(new URL("https://www.instagram.com/clinica")), "Instagram");
  assert.equal(walledSite(new URL("https://m.facebook.com/clinica")), "Facebook");
  assert.equal(walledSite(new URL("https://wa.me/5215555555555")), "WhatsApp");
  assert.equal(walledSite(new URL("https://clinica.mx")), null);
});
