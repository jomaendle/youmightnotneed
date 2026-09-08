import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  // proxy.ts imports through the same alias the app uses, and it is worth
  // testing directly: it decides which representation a rule URL answers with.
  resolve: {
    alias: { "@": fileURLToPath(new URL(".", import.meta.url)) },
  },
  test: {
    include: ["lib/**/*.test.ts", "app/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text-summary", "lcov"],
      // The adapter layer: pure functions that decide what a report means.
      // Components and pages are covered by the build and the screenshots.
      include: [
        "lib/permalink.ts",
        "lib/parse-input.ts",
        // The negotiation. Serving markdown to a browser is the one failure
        // here that breaks the site rather than a feature, so these two are
        // held to the same bar as the report parsing.
        "lib/accept.ts",
        "proxy.ts",
      ],
      thresholds: { lines: 90, functions: 90, branches: 85, statements: 90 },
    },
  },
});
