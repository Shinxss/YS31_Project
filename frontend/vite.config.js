import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const backendBase = env.VITE_API_BASE_URL || env.BACKEND_URL || "http://localhost:5000";

  return {
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "src"),
      },
      dedupe: ["react", "react-dom"],
    },
    optimizeDeps: {
      include: ["react", "react-dom"],
      force: true,
    },
    server: {
      port: 5173, // ✅ student/company portal port
      open: true, // optional – auto-open in browser
      proxy: {
        "/api": {
          target: backendBase,
          changeOrigin: true,
          secure: false,
        },
      },
    },
  };
});