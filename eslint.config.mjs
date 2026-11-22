import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const noDirectIo = {
  "no-restricted-globals": [
    "error",
    { name: "localStorage", message: "Use a hook from lib/hooks. Only lib/repo may touch storage." },
    { name: "sessionStorage", message: "Use useSessionFlag from lib/hooks." },
    { name: "fetch", message: "Use a hook from lib/hooks. Only lib/repo may call the network." },
    { name: "BroadcastChannel", message: "Only lib/repo/mock may use BroadcastChannel." },
  ],
};

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([".next/**", "out/**", "node_modules/**", "photos/**", "playwright-report/**", "test-results/**", "next-env.d.ts"]),
  {
    files: ["components/**/*.{ts,tsx}", "app/**/*.{ts,tsx}"],
    ignores: ["app/api/**"],
    rules: noDirectIo,
  },
  {
    rules: {
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
    },
  },
]);
