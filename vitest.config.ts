import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL("./", import.meta.url)) } },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    env: { NEXT_PUBLIC_MIN_SUBMIT_MS: "2000", NEXT_PUBLIC_MOCK_LATENCY: "off" },
  },
});
