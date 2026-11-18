# Ops audit rubric (starter: tune after the first run)

1. `/mnt/session/outputs/audit.md` exists and opens with a "fix first" list of at most five items.
2. Every finding has a priority (P0-P3), a URL or hostname, evidence (status code, header, DNS record, command output or quoted HTML) and a concrete fix.
3. SPF, DKIM (or a note that no selector could be discovered), DMARC and MX are reported for both hola.allok.fun and allok.fun with the raw record text.
4. At least 15 distinct URLs of allok.fun were requested, and broken links (4xx/5xx) are listed with the page that links to them, or the report says none were found.
5. Every wa.me link found on the site is listed with its number and prefilled text, and any mismatch between them is flagged.
6. SEO basics (title, description, canonical, H1, OG image) are reported for at least the home page, /agente-whatsapp and two /whatsapp-para/ pages.
7. No finding is speculative: claims without evidence are absent.
