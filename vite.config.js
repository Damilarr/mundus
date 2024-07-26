import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        background: resolve(__dirname, "src/background/background.jsx"),
        contentScript: resolve(__dirname, "src/contentScript.js"),
      },
      output: {
        entryFileNames: "assets/[name].js",
      },
    },
    outDir: "dist",
  },
  optimizeDeps: {
    include: [
      "zod",
      "@langchain/google-genai",
      "@langchain/core/output_parsers",
      "@langchain/core/prompts",
      "react",
      "react-dom",
    ],
  },
});
