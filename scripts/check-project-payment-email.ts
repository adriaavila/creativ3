import assert from "node:assert/strict";
import { projectPaymentEmail } from "../src/lib/project-payment-email";

const email = projectPaymentEmail({ name: "Ava <Co>", amount: 20_000, currency: "usd" });
assert.match(email.html, /Ava &lt;Co&gt;/);
assert.match(email.html, /\$200\.00/);
const continuation = projectPaymentEmail({
  name: null,
  amount: 20_000,
  currency: "eur",
  kind: "continuation",
});
assert.match(continuation.html, /Continuación de proyecto/);
assert.doesNotMatch(continuation.html, /Depósito de inicio/);
assert.match(continuation.html, /€200\.00/);

console.log("Project payment email OK.");
