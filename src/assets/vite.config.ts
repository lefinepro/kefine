import { defineConfig } from "vite";
import path from "path";

export default defineConfig({
  mode: "rolldown",
  build: {
    rollupOptions: {
      input: {
        main: "./src/main.ts",
      },
      output: {
        dir: "../../public/dist",
        entryFileNames: "assets/[name].js",
        chunkFileNames: "assets/[name].[hash].js",
        assetFileNames: (assetInfo) => {
          if (assetInfo.name && assetInfo.name.endsWith(".css")) {
            return "assets/style.css";
          }
          return "assets/[name].[hash].[ext]";
        },
      },
    },
    watch: {
      include: ["src/**/*"],
    },
  },
  publicDir: "../public",
  server: {
    host: true,
    port: 3000,
    open: true,
    watch: {
      usePolling: true,
    },
  },
  root: ".",
  base: "/dist/",
  optimizeDeps: {
    include: ["@fontsource/inter", "@fontsource/commit-mono"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
