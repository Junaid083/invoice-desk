import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL(".", import.meta.url)) },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    // The API and seed tests share one test database
    fileParallelism: false,
    env: {
      MONGODB_URI: process.env.MONGODB_URI ?? "mongodb://localhost:27017",
      MONGODB_DB: "invoice_desk_test",
    },
  },
});
