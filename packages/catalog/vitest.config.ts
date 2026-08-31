import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text-summary", "lcov"],
      include: ["src/**/*.ts"],
      // Generated snapshots are data, and rules are data with prose in them.
      // Both are covered by the catalog integrity tests rather than by
      // exercising every branch, so measuring them would flatter the number.
      exclude: ["src/generated/**", "src/rules/**", "src/**/*.test.ts"],
      thresholds: {
        lines: 95,
        functions: 95,
        branches: 90,
        statements: 95,
      },
    },
  },
});
