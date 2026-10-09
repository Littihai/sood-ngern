import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    testTimeout: 20000,
    hookTimeout: 30000,
    // The emulator keeps one database: run files serially to avoid cross-test interference.
    fileParallelism: false,
  },
});
