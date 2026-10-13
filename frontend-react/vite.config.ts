import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: { port: 5174, strictPort: true },
  build: { outDir: "dist-samples" },
  test: { environment: "jsdom", include: ["tests/**/*.test.{ts,tsx}", "src/reused/**/*.test.ts"], setupFiles: ["tests/setup.ts"] },
});
