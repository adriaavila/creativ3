-- Ad-hoc project payments (nodria, project-deposit, client continuations) go
-- through the same checkout as WAHA/Cloud API purchases but have no WhatsApp
-- channel at all. NOT NULL forced checkout to lie and stamp "waha" on every
-- one of them. The CHECK already permits NULL on its own (NULL IN (...) is
-- NULL, not FALSE) — only NOT NULL was blocking it.
ALTER TABLE stripe_purchases ALTER COLUMN channel DROP NOT NULL;
