import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: { environment: "node", include: ["tests/**/*.test.ts"] },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      // Allow importing server modules in tests.
      "server-only": path.resolve(__dirname, "tests/server-only-stub.ts"),
    },
  },
});
