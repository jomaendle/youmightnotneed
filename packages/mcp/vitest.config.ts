import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text-summary", "lcov"],
      // bin.ts and server.ts run in a spawned child process during
      // bin.test.ts, so in-process v8 coverage can't see them. Only
      // tools.ts's pure functions are measured here, same reasoning as
      // packages/cli's bin.ts exclusion.
      include: ["src/tools.ts"],
      thresholds: {
        lines: 90,
        functions: 90,
        branches: 85,
        statements: 90,
      },
    },
  },
});
