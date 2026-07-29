// Self-check for the number the Revenue Desk is billed on.
// Run: pnpm tsx scripts/check-outcome-share.ts
import assert from "node:assert/strict";
import { outcomeShare } from "../src/lib/whatsapp-inbox-db";

// Empty month is "no data", not 0% — a 0% would read as a failed month we can be
// held to. This is the case that matters for invoices.
assert.equal(outcomeShare(0, 0), null);
assert.equal(outcomeShare(0, 12), 0);
assert.equal(outcomeShare(12, 12), 100);
assert.equal(outcomeShare(1, 3), 33);
assert.equal(outcomeShare(2, 3), 67);

console.log("outcomeShare ok");
