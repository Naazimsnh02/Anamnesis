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
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Standalone manual smoke-test script run directly via tsx against the
    // live Cognee/DB instance — not part of the compiled app (see
    // tsconfig.json's matching exclude).
    "scratch-e2e.mts",
  ]),
]);

export default eslintConfig;
