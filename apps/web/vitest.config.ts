import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["lib/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text-summary", "lcov"],
      // The adapter layer: pure functions that decide what a report means.
      // Components and pages are covered by the build and the screenshots.
      include: ["lib/permalink.ts", "lib/parse-input.ts"],
      thresholds: { lines: 90, functions: 90, branches: 85, statements: 90 },
    },
  },
});
