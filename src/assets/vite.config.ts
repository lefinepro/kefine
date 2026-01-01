import { defineConfig } from "vite";
import path from "path";
import fs from "fs";

// Copy icons to public/dist during build
function copyIconsPlugin() {
  return {
    name: "copy-icons",
    writeBundle() {
      const srcDir = path.resolve(__dirname, "src/icons");
      const destDir = path.resolve(__dirname, "../../public/dist/icons");

      // Create destination directory if it doesn't exist
      if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
      }

      // Copy all SVG files
      if (fs.existsSync(srcDir)) {
        const files = fs.readdirSync(srcDir);
        for (const file of files) {
          if (file.endsWith(".svg")) {
            fs.copyFileSync(
              path.join(srcDir, file),
              path.join(destDir, file)
            );
          }
        }
        console.log(`Copied ${files.filter(f => f.endsWith(".svg")).length} icons to dist/icons`);
      }
    },
  };
}

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
  plugins: [copyIconsPlugin()],
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
