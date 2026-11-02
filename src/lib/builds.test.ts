import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { BUILDS, formatDate, isNew, nextShip, reservedSlot, showcaseOrder, type Build } from "./builds";

test("dates read 01 Nov 2026", () => {
  assert.equal(formatDate("2026-11-01"), "01 Nov 2026");
  assert.equal(formatDate("2026-12-13"), "13 Dec 2026");
});

test("the featured build leads, live before building", () => {
  assert.deepEqual(showcaseOrder().map((b) => b.slug), ["vocero", "dilo", "banter"]);
  assert.equal(BUILDS.filter((b) => b.featured).length, 1, "one blue field per page");
});

test("next ship date, reserved slot and New come from the dates", () => {
  assert.equal(nextShip(BUILDS, "2026-11-02"), "2026-11-15");
  assert.equal(nextShip(BUILDS, "2026-11-20"), "2026-11-29");
  assert.equal(nextShip(BUILDS, "2026-12-01"), null);
  assert.equal(reservedSlot(), "2026-12-13");
  const dilo = BUILDS.find((b) => b.slug === "dilo") as Build;
  assert.equal(isNew(dilo, "2026-11-02"), true);
  assert.equal(isNew(dilo, "2026-11-15"), false);
});

test("the design system's generated CSS is up to date", () => {
  execFileSync("node", ["scripts/build-allok-ds.mjs", "--check"], { stdio: "pipe" });
});
