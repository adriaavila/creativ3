import { defineAgent } from "eve";
import { model } from "./lib/model.js";

export default defineAgent({
  model,
  compaction: { thresholdPercent: 0.75 },
});
