import { test } from "node:test";
import assert from "node:assert/strict";
import { demoProfileSchema } from "./demo-agent";
import {
  extractJson,
  groundProfile,
  htmlToText,
  isUsableProfile,
  leadsFromCsv,
  mapLeadColumns,
  normalizeUrl,
  parseCsv,
  parseProfileResponse,
  pickUsefulLinks,
} from "./demo-profile-build";

test("parseCsv: comillas, comas y saltos dentro, BOM y punto y coma", () => {
  assert.deepEqual(parseCsv('﻿a,b\n"x, y","di ""hola"""\n'), [
    ["a", "b"],
    ["x, y", 'di "hola"'],
  ]);
  assert.deepEqual(parseCsv('a;b\r\n1;"dos\nlíneas"'), [
    ["a", "b"],
    ["1", "dos\nlíneas"],
  ]);
});

test("mapLeadColumns: acepta los nombres en español e inglés", () => {
  const cols = mapLeadColumns(["Nombre", "Sitio web", "Ciudad", "País", "Vertical", "email"]);
  assert.deepEqual(cols, { name: 0, website: 1, city: 2, country: 3, sector: 4 });
  assert.equal(mapLeadColumns(["business_name", "website_url"]).city, null);
});

test("leadsFromCsv: salta filas sin web y normaliza país y URL", () => {
  const csv = "business_name,website,city,country,vertical\nClínica Sonrisa,sonrisa.mx,CDMX,MX,clinica dental\nSin web,,Bogotá,CO,academia\n";
  const { leads, skipped } = leadsFromCsv(csv);
  assert.equal(skipped, 1);
  assert.deepEqual(leads, [{ name: "Clínica Sonrisa", website: "https://sonrisa.mx/", city: "CDMX", country: "México", sector: "clinica dental" }]);
});

test("normalizeUrl", () => {
  assert.equal(normalizeUrl("www.ejemplo.co"), "https://www.ejemplo.co/");
  assert.equal(normalizeUrl("http://ejemplo.mx/servicios#x"), "http://ejemplo.mx/servicios");
  assert.equal(normalizeUrl("no es url"), null);
  assert.equal(normalizeUrl("javascript:alert(1)"), null);
  assert.equal(normalizeUrl(""), null);
});

const HTML = `<!doctype html><html><head><title>Clínica Sonrisa &amp; Más</title>
<meta name="description" content="Dentistas en Narvarte">
<style>.x{color:red}</style><script>var precio = 999;</script>
<script type="application/ld+json">{"@type":"Dentist","telephone":"55 1234 5678"}</script></head>
<body><nav><a href="/servicios">Servicios</a><a href="/precios/">Precios</a><a href="https://facebook.com/x">FB</a>
<a href="/blog/post">Blog</a><a href="/contacto">Contáctanos</a><a href="/servicios#top">Servicios</a></nav>
<h1>Limpieza dental</h1><p>Desde $650&nbsp;MXN. Lunes a viernes 9:00&ndash;19:00</p></body></html>`;

test("htmlToText: texto, título, descripción y JSON-LD; sin scripts ni estilos", () => {
  const text = htmlToText(HTML);
  assert.match(text, /TÍTULO: Clínica Sonrisa & Más/);
  assert.match(text, /DESCRIPCIÓN: Dentistas en Narvarte/);
  assert.match(text, /Desde \$650 MXN/);
  assert.match(text, /9:00–19:00/);
  assert.match(text, /DATOS ESTRUCTURADOS: .*55 1234 5678/);
  assert.doesNotMatch(text, /999|color:red/);
});

test("pickUsefulLinks: mismo sitio, sin repetidos, precios primero", () => {
  const links = pickUsefulLinks(HTML, "https://www.sonrisa.mx/");
  assert.deepEqual(links, ["https://www.sonrisa.mx/precios", "https://www.sonrisa.mx/servicios", "https://www.sonrisa.mx/contacto"]);
});

test("extractJson: con cercas, texto alrededor y comas colgantes", () => {
  assert.deepEqual(extractJson('Claro:\n```json\n{"a": 1, "b": [1,2,],}\n```'), { a: 1, b: [1, 2] });
  assert.deepEqual(extractJson('Aquí va {"a": "llave } en texto"} y listo'), { a: "llave } en texto" });
  assert.equal(extractJson("sin json"), null);
  assert.equal(extractJson("{roto"), null);
});

test("parseProfileResponse: tolera null y vacíos, rechaza lo que no valida", () => {
  const p = parseProfileResponse('{"summary": null, "services": [{"name": "Limpieza", "price": ""}], "hours": [], "email": "", "faqs": []}');
  assert.ok(p);
  assert.deepEqual(p.services, [{ name: "Limpieza" }]);
  assert.equal(p.email, undefined);
  assert.equal(parseProfileResponse('{"services": "no es lista"}'), null);
  assert.equal(parseProfileResponse("nada"), null);
});

test("groundProfile: poda precios, teléfonos y datos que la web no dice", () => {
  const source = htmlToText(HTML) + "\nAv. Universidad 1200, Narvarte. Ortodoncia. Escríbenos a hola@sonrisa.mx";
  const invented = demoProfileSchema.parse({
    services: [
      { name: "Limpieza dental", price: "$650 MXN" },
      { name: "Ortodoncia", price: "$15,000" },
      { name: "Implantes de titanio", price: "$9,000" },
    ],
    hours: ["Lunes a viernes 9:00 a 19:00", "Domingos 10:00 a 14:00", "Lunes a viernes 8:00 a 20:00"],
    address: "Av. Universidad 1200, Narvarte",
    phone: "+52 55 1234 5678",
    whatsapp: "55 9999 0000",
    email: "contacto@sonrisa.mx",
    faqs: [{ q: "¿Aceptan seguros?", a: "Sí, aceptamos todas las aseguradoras." }],
  });
  const { profile, dropped } = groundProfile(invented, source);
  assert.deepEqual(profile.services, [{ name: "Limpieza dental", price: "$650 MXN" }, { name: "Ortodoncia" }]);
  assert.deepEqual(profile.hours, ["Lunes a viernes 9:00 a 19:00"]);
  assert.equal(profile.address, "Av. Universidad 1200, Narvarte");
  assert.equal(profile.phone, "+52 55 1234 5678");
  assert.equal(profile.whatsapp, undefined);
  assert.equal(profile.email, undefined);
  assert.deepEqual(profile.faqs, []);
  assert.ok(dropped.some((d) => d.includes("$15,000")));
  assert.ok(dropped.some((d) => d.includes("Implantes")));
  assert.ok(isUsableProfile(profile));
  assert.equal(isUsableProfile(demoProfileSchema.parse({})), false);
});
