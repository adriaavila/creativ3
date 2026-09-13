import assert from "node:assert/strict";
import { test } from "node:test";
import { bearerMatches } from "./handover/bearer";

const SECRET = "un-secreto-de-mas-de-16-chars";

test("bearerMatches acepta solo el secreto exacto", () => {
  assert.equal(bearerMatches(`Bearer ${SECRET}`, SECRET), true);
  assert.equal(bearerMatches(`Bearer ${SECRET}x`, SECRET), false);
  assert.equal(bearerMatches(`Bearer ${SECRET.slice(0, -1)}`, SECRET), false);
  assert.equal(bearerMatches(SECRET, SECRET), false, "sin el esquema Bearer no pasa");
  assert.equal(bearerMatches(null, SECRET), false);
});

test("bearerMatches se cierra cuando no hay secreto o es corto", () => {
  assert.equal(bearerMatches(`Bearer ${SECRET}`, undefined), false);
  assert.equal(bearerMatches("Bearer corto", "corto"), false, "un secreto corto no autoriza nada");
  assert.equal(bearerMatches("Bearer ", ""), false);
});
