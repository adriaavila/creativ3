import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import proxy from "../src/proxy";

delete process.env.OPS_SESSION_SECRET;

const login = proxy(new NextRequest("https://allok.fun/ops-login"));
assert.equal(login.status, 200, "login page must stay reachable");

const ops = proxy(new NextRequest("https://allok.fun/ops/inbox"));
assert.equal(ops.status, 307, "unauthenticated ops pages must redirect");
assert.equal(ops.headers.get("location"), "https://allok.fun/ops-login?next=%2Fops%2Finbox");

const api = proxy(new NextRequest("https://allok.fun/api/ops/inbox"));
assert.equal(api.status, 401, "unauthenticated ops APIs must reject");

console.log("ok: ops proxy routing checks passed");
