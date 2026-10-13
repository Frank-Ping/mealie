import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: "dist-components",
    lib: { entry: fileURLToPath(new URL("src/component-entry.ts", import.meta.url)), formats: ["es"] },
    rolldownOptions: { external: ["react", "react/jsx-runtime", "react-dom", "@mui/material", "react-router", "react-i18next", "i18next", "@mdi/js"] },
  },
});
