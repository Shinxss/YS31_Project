import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
    // ✅ Prevent multiple React copies
    dedupe: ["react", "react-dom"],
  },
  optimizeDeps: {
    // ✅ Forces Vite to prebundle with your React 18 copy
    include: ["react", "react-dom"],
    force: true,
  },
});
