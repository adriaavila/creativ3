import { defineAgent } from "eve";
import { model } from "../../lib/model.js";

export default defineAgent({
  description: "Turns researched lead evidence into concise, personalized outreach drafts for mandatory human review.",
  model,
});
