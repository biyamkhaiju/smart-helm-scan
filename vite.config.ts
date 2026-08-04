import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";

// Pure Vite SPA — no TanStack Start / Nitro SSR needed.
// Camera access is client-side only, so SSR adds zero value here.
export default defineConfig({
  plugins: [
    TanStackRouterVite({
      routesDirectory: "./src/routes",
      generatedRouteTree: "./src/routeTree.gen.ts",
      quoteStyle: "double",
    }),
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      "@": import.meta.dirname + "/src",
    },
  },
  build: {
    // Output to dist/ — Vercel's default for Vite projects.
    outDir: "dist",
  },
});
