import assert from "node:assert/strict";
import { test } from "node:test";
import { IDEAS, findIdea, ideaNumber, ideaPath, ideaReply, shareLinks } from "./pen-ideas";
import { GLYPHS } from "./pen-linea";

test("cada idea tiene una dirección única y que no hay que escapar", () => {
  const slugs = IDEAS.map((i) => i.slug);
  assert.equal(new Set(slugs).size, slugs.length);
  for (const slug of slugs) assert.match(slug, /^[a-z0-9]+(-[a-z0-9]+)*$/);
});

test("cada idea cabe en su imagen al compartir y tiene qué leer", () => {
  for (const idea of IDEAS) {
    assert.ok(idea.title.length <= 64, `${idea.slug}: el título no cabe en la imagen`);
    assert.ok(idea.belief.length <= 44, `${idea.slug}: lo tachado no cabe en un renglón`);
    assert.ok(idea.body.length >= 1);
    assert.ok(GLYPHS.includes(idea.glyph));
    assert.equal(findIdea(idea.slug), idea);
  }
});

test("el número de una idea no cambia cuando llega otra: la más vieja es la 01", () => {
  assert.equal(ideaNumber(IDEAS[IDEAS.length - 1]!), "01");
  assert.equal(ideaNumber(IDEAS[0]!), String(IDEAS.length).padStart(2, "0"));
});

test("los enlaces para compartir llevan la dirección pública de la idea", () => {
  const idea = IDEAS[0]!;
  const url = `https://allok.fun${ideaPath(idea)}`;
  for (const link of shareLinks(ideaPath(idea), idea.title)) {
    assert.ok(decodeURIComponent(link.href).includes(url), link.id);
    assert.ok(link.href.startsWith("https://"));
  }
  assert.ok(ideaReply(idea).includes(idea.title));
});
