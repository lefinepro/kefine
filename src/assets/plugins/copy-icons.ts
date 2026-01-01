import path from "path";
import fs from "fs";
import type { Plugin } from "vite";

/**
 * Vite plugin to copy icons to public/dist during build
 * Copies all SVG files from src/icons to the dist/icons directory
 */
export function copyIconsPlugin(): Plugin {
  return {
    name: "copy-icons",
    writeBundle() {
      const srcDir = path.resolve(__dirname, "../src/icons");
      const destDir = path.resolve(__dirname, "../../../public/dist/icons");

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
