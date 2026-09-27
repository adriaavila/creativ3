---
cron: "0 13 * * 1-5"
---

Run the daily acquisition workflow. Read the plan with `read_growth_plan`. Research businesses in Chile, Uruguay, Venezuela and Paraguay that sell or book over WhatsApp (lawyers, aesthetics and spas, clinics, real estate), one vertical per run. Save at most 5 that pass the filter (score 7 or more, public WhatsApp verified by URL, a concrete sign they sell over WhatsApp); fewer is fine. For each saved lead, create the WhatsApp sequence for human review: a first message that invites them to try the agent (with the exact link from the plan), followup_1 and followup_2. Publish only anonymous activity events and complete the run. Never send outreach.
