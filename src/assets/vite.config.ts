import { defineConfig } from "vite";
import path from "path";
import { copyIconsPlugin } from "./plugins/copy-icons";

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
  },
  plugins: [copyIconsPlugin()],
  publicDir: "../public",
  optimizeDeps: {
    include: ["@fontsource/inter", "@fontsource/commit-mono"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
