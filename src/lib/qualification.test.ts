import assert from "node:assert/strict";
import test from "node:test";
import { qualificationRecommendations } from "./qualification";

test("qualification recommendations change with the sales bottleneck", () => {
  const slow = qualificationRecommendations("es", "Respondemos tarde");
  const lost = qualificationRecommendations("es", "Se nos pierden consultas");

  assert.notDeepEqual(slow, lost);
  assert.match(slow.join(" "), /esperando/);
  assert.match(lost.join(" "), /Pipeline/);
  assert.equal(qualificationRecommendations("en", "unknown").length, 3);
});
