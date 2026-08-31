import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text-summary", "lcov"],
      // bin.ts is mostly argument parsing and process.exit() calls. Its pure
      // path-resolution helpers have their own tests in bin.test.ts; the rest
      // is left out of the threshold rather than chased for coverage.
      include: ["src/render.ts", "src/colors.ts"],
      thresholds: {
        lines: 90,
        functions: 90,
        branches: 85,
        statements: 90,
      },
    },
  },
});
