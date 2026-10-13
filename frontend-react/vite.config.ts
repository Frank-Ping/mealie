import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { "~": fileURLToPath(new URL("../frontend/app", import.meta.url)) } },
  server: { port: 5174, strictPort: true },
  build: { outDir: "dist-samples" },
  test: { environment: "jsdom", include: ["tests/**/*.test.{ts,tsx}", "src/reused/**/*.test.ts"], setupFiles: ["tests/setup.ts"] },
});
