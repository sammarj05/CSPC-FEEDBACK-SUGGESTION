import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment:     "node",
    globals:         false,
    testTimeout:     35000,
    fileParallelism: false,
    env: {
      NODE_ENV: "test",
    },
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
    },
  },
});
