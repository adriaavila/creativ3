import assert from "node:assert/strict";
import test from "node:test";
import { createOpsSessionToken, opsSessionKey, verifyOpsSessionToken } from "@/lib/ops-session";
import { loginBlocked } from "@/lib/ops-login-throttle";

const SECRET = "s".repeat(40);

test("cambiar la contraseña cierra las sesiones abiertas", () => {
  const token = createOpsSessionToken("allok-ops-owner", opsSessionKey(SECRET, "vieja"));
  assert.ok(verifyOpsSessionToken(token, opsSessionKey(SECRET, "vieja")));
  assert.equal(verifyOpsSessionToken(token, opsSessionKey(SECRET, "nueva")), null);
});

test("una sesión vencida o manipulada no entra", () => {
  const key = opsSessionKey(SECRET, "clave");
  assert.equal(verifyOpsSessionToken(createOpsSessionToken("x", key, -1), key), null);
  const token = createOpsSessionToken("x", key);
  assert.equal(verifyOpsSessionToken(`${token}a`, key), null);
  assert.equal(verifyOpsSessionToken("sin-punto", key), null);
});

test("el login se frena a los 5 fallos por IP o 30 en total", () => {
  assert.equal(loginBlocked({ ip: 4, all: 4 }), false);
  assert.equal(loginBlocked({ ip: 5, all: 5 }), true);
  assert.equal(loginBlocked({ ip: 0, all: 30 }), true);
});
