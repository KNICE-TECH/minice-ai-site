import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { "@": path.resolve(__dirname, "src") },
  },
  build: {
    target: "es2022",
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          three: ["three"],
          r3f: ["@react-three/fiber", "@react-three/drei", "@react-three/postprocessing"],
        },
      },
    },
  },
  server: {
    port: 5173,
    strictPort: false,
    allowedHosts: [".trycloudflare.com", ".ngrok.io", ".loca.lt"],
    proxy: {
      // Forward /api/* to the local Hono server during development.
      // In production, Hono itself serves dist/ and there is no proxy.
      "/api": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },
    },
  },
});
