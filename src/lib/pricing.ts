/**
 * Single source of truth for Allok's commercial numbers — implementation
 * band, subscription band, and the seven-day timeline's day markers.
 *
 * Deliberately language-neutral (USD figures, day indices): the copy that
 * goes with each entry (labels, descriptions, what's included) lives in
 * `src/messages/{es,en}.json` under `home.pricing.stages` and
 * `home.timeline.days`, indexed positionally against these arrays, so the
 * site stays bilingual with the numbers defined exactly once.
 */

export type PricingStageId = "implementation" | "operation" | "expansion";

export type PricingStageAmount = {
  id: PricingStageId;
  range: string;
  cadence: "one_time" | "monthly" | "optional";
};

export const PRICING_STAGES: PricingStageAmount[] = [
  { id: "implementation", range: "USD 500–1.500", cadence: "one_time" },
  { id: "operation", range: "USD 99–299", cadence: "monthly" },
  { id: "expansion", range: "—", cadence: "optional" },
];

export const IMPLEMENTATION_TIMELINE_DAYS = ["1", "2", "3–4", "5", "6", "7"] as const;
