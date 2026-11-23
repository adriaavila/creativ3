# Lead list rubric (starter: tune after the first run)

Segment: {{SEGMENT}}. Target: {{COUNT}} accepted rows.

1. `/mnt/session/outputs/leads.csv` exists, is valid CSV with the exact header `business_name,website,email,email_source,city,country,sector,oferta_1_linea,whatsapp,whatsapp_source,hallazgo_1,hallazgo_2,evidence_urls,score`, and has between {{MIN}} and {{MAX}} data rows.
2. Every `country` is one of: {{COUNTRIES}}. Every `city` is one of the cities named in the task. No city holds more than 40% of the rows, and at least {{MIN_VERTICALS}} different verticals appear.
3. Every `email` is on the same registrable domain as `website`, or `email_source` is a URL on the website's domain. No email is on a webmail domain (gmail, hotmail, outlook, yahoo, icloud, live, proton) or is a noreply/postmaster/webmaster address.
4. Every accepted row has a line in `verification.jsonl` whose `email_quote` contains the row's email verbatim, and at least 25% of those lines have `verified_by` = "lead".
5. No two rows share a website domain, and no row's domain appears in `/mnt/session/uploads/exclude.txt` (when that file exists).
6. Every `oferta_1_linea` is at most 140 characters, specific to that business (not a generic sector description), and in Spanish.
7. Every row has `hallazgo_1` and `hallazgo_2`, each under 200 characters, each an observable fact about the site or its WhatsApp channel; none contains a number about the business's sales, revenue, or customers that is not on its site.
8. Every `score` is an integer from 7 to 10, and every row has a non-empty `whatsapp` with a `whatsapp_source` URL.
9. `rejected.csv` and `summary.md` exist; `summary.md` reports rows per city and vertical and the rejection reasons by count.
