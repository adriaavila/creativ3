import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { COMPARISONS, SEO_PAGES, VERTICALS, fullTitle, seoCta, seoPath } from "./seo-pages";
import { faqJsonLd, jsonLdHtml } from "./seo";
import { registerUrl } from "./plans";

test("las nueve páginas, con rutas únicas", () => {
  assert.equal(COMPARISONS.length, 3);
  assert.equal(VERTICALS.length, 6);
  const paths = SEO_PAGES.map(seoPath);
  assert.equal(new Set(paths).size, paths.length);
  for (const p of ["/alternativa-a/kommo", "/alternativa-a/leadsales", "/alternativa-a/wati", "/whatsapp-para/inmobiliarias"]) {
    assert.ok(paths.includes(p), p);
  }
});

for (const page of SEO_PAGES) {
  const path = seoPath(page);

  test(`${path}: título de 60 caracteres o menos, con la firma`, () => {
    assert.ok(fullTitle(page).length <= 60, `${fullTitle(page).length}: ${fullTitle(page)}`);
  });

  test(`${path}: descripción de 160 caracteres o menos`, () => {
    assert.ok(page.description.length > 50, "descripción demasiado corta");
    assert.ok(page.description.length <= 160, `${page.description.length}: ${page.description}`);
  });

  test(`${path}: al menos tres preguntas frecuentes, sin repetir`, () => {
    assert.ok(page.faqs.length >= 3);
    assert.equal(new Set(page.faqs.map((f) => f.q)).size, page.faqs.length);
    for (const f of page.faqs) assert.ok(f.q.trim() && f.a.trim());
  });

  test(`${path}: tiene un botón`, () => {
    const cta = seoCta(page);
    assert.ok(cta.href && cta.label);
  });

  test(`${path}: sin promesas de tiempo fijo ni palabras de humo`, () => {
    const text = JSON.stringify(page).toLowerCase();
    for (const banned of ["revolucion", "en segundos", "24/7", "al instante", "garantizado", "prueba gratis", "días gratis"]) {
      assert.ok(!text.includes(banned), `«${banned}» en ${path}`);
    }
  });
}

test("el H1 de las comparaciones es «Alternativa a X para WhatsApp»", () => {
  for (const page of COMPARISONS) {
    assert.equal(page.h1, `Alternativa a ${page.competitor} para WhatsApp`);
    assert.ok(page.rows.length >= 2);
    assert.ok(page.pickThem.length >= 2, "decir cuándo conviene el otro");
    assert.match(page.source.url, /^https:\/\//);
  }
});

test("cada dato de la competencia cita su fuente en el código", () => {
  const src = readFileSync(new URL("./seo-pages.ts", import.meta.url), "utf8");
  for (const page of COMPARISONS) {
    assert.ok(src.includes(`// Fuente: ${page.source.url}`), page.slug);
  }
});

test("inmobiliarias manda a REI; el resto al botón de los planes", () => {
  for (const page of VERTICALS) {
    const cta = seoCta(page);
    if (page.slug === "inmobiliarias") assert.equal(cta.href, "/rei");
    else assert.notEqual(cta.href, "/rei");
  }
});

test("con autoservicio, el botón es el registro del plan Completo", () => {
  const before = process.env.NEXT_PUBLIC_SELF_SERVE;
  process.env.NEXT_PUBLIC_SELF_SERVE = "true";
  try {
    assert.equal(seoCta(COMPARISONS[0]!).href, registerUrl("pro"));
  } finally {
    if (before === undefined) delete process.env.NEXT_PUBLIC_SELF_SERVE;
    else process.env.NEXT_PUBLIC_SELF_SERVE = before;
  }
});

test("el FAQPage lleva cada pregunta y escapa «<»", () => {
  const ld = faqJsonLd([{ q: "¿Uno?", a: "</script><b>" }]);
  assert.equal(ld["@type"], "FAQPage");
  assert.equal(ld.mainEntity[0]!.acceptedAnswer.text, "</script><b>");
  assert.ok(!jsonLdHtml(ld).includes("<"));
});
