import assert from "node:assert/strict";
import { test } from "node:test";
import { stageProgress } from "./scroll-stage";

// Section 2000px tall in an 800px viewport → 1200px of travel.
test("stageProgress maps stage travel to 0..1", () => {
  assert.equal(stageProgress(0, 2000, 800), 0);
  assert.equal(stageProgress(-600, 2000, 800), 0.5);
  assert.equal(stageProgress(-1200, 2000, 800), 1);
});

test("stageProgress clamps outside the stage", () => {
  assert.equal(stageProgress(400, 2000, 800), 0, "above the stage");
  assert.equal(stageProgress(-5000, 2000, 800), 1, "past the stage");
});

test("stageProgress survives a section shorter than the viewport", () => {
  assert.equal(stageProgress(-10, 500, 800), 1);
  assert.equal(stageProgress(0, 500, 800), 0);
});
