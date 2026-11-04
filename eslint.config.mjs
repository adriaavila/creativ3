import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    ".claude/**",
    "out/**",
    "build/**",
    "**/.eve/**",
    "**/.output/**",
    "next-env.d.ts",
    // Generated from public/allok/motion.js (linted) by scripts/build-allok-ds.mjs: minified code is not for review.
    "public/allok/motion.min.js",
  ]),
]);

export default eslintConfig;
