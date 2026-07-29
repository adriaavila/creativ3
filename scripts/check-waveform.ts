/**
 * npx tsx scripts/check-waveform.ts
 *
 * The mark is generated, not hand-drawn, so the generator is what can break it.
 */
import assert from "node:assert/strict";
import { wavePath } from "../src/lib/waveform";

const d = wavePath({ cycles: 7, width: 100, amp: 20, midY: 50 });
const segments = d.split("Q").length - 1;

assert.equal(segments, 14, "7 cycles must emit 14 half-cycle quadratics");
assert.ok(d.startsWith("M0 50"), `must start on the centre line, got ${d.slice(0, 12)}`);
assert.ok(d.trimEnd().endsWith("100 50"), "must land back on the centre line at full width");
assert.equal(d, wavePath({ cycles: 7, width: 100, amp: 20, midY: 50 }), "must be deterministic");

// Control points sit at 2×peak, so they may reach 2×amp from the centre line —
// but never further, or the stroke escapes the viewBox.
const ys = [...d.matchAll(/Q[\d.]+ (-?[\d.]+)/g)].map((m) => Number(m[1]));
assert.ok(Math.max(...ys.map((y) => Math.abs(y - 50))) <= 40.01, "control points must stay within 2×amp");

// First lobe rises (SVG y decreases), and the envelope waists in the middle.
assert.ok(ys[0] < 50, "first lobe must rise");
const dist = ys.map((y) => Math.abs(y - 50));
const waistIdx = ys.length / 2;
assert.ok(dist[waistIdx] < dist[Math.round(ys.length * 0.25)], "middle must be the waist, not a peak");

console.log("waveform ok —", segments, "segments,", d.length, "chars");
