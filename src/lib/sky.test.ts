import { test } from "node:test";
import assert from "node:assert/strict";
import { INK, contrast, skyPalette, skyVars } from "./sky";

// The promise the whole design rests on: one ink colour stays readable over
// every sky the scroll can produce. If a palette edit breaks this, it breaks
// here rather than in someone's eyes.
test("ink clears WCAG AA over every sky colour across the range", () => {
  for (let i = 0; i <= 20; i++) {
    const t = i / 20;
    const { high, mid, low } = skyPalette(t);
    for (const [name, colour] of Object.entries({ high, mid, low })) {
      const ratio = contrast(INK, colour);
      assert.ok(
        ratio >= 4.5,
        `t=${t.toFixed(2)} ${name} contrast ${ratio.toFixed(2)} < 4.5`,
      );
    }
  }
});

test("t is clamped, so a runaway scroll value can't blow up the palette", () => {
  assert.deepEqual(skyPalette(-3), skyPalette(0));
  assert.deepEqual(skyPalette(9), skyPalette(1));
  assert.equal(skyVars(-3)["--sky-t"], "0");
});
