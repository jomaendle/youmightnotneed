import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text-summary", "lcov"],
      // bin.ts is the I/O shell: argument parsing and process exits. It is
      // exercised end to end by the CLI smoke test in CI, not by unit tests.
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
