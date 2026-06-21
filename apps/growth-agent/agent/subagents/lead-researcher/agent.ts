import { defineAgent } from "eve";
import { model } from "../../lib/model.js";

export default defineAgent({
  description: "Researches Venezuelan businesses, verifies public evidence, scores opportunities, and persists at most 10 qualified leads.",
  model,
});
