import { test } from "node:test";
import { execFileSync } from "node:child_process";

test("the design system's generated CSS is up to date", () => {
  execFileSync("node", ["scripts/build-allok-ds.mjs", "--check"], { stdio: "pipe" });
});
