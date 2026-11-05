import { cp, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const root = fileURLToPath(new URL(".", import.meta.url));
const extensionDirectory = path.join(root, "extension");
const extensionFiles = ["manifest.json", "background.js", "icons"];

async function watchFiles(context, directory) {
  context.addWatchFile(directory);
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) await watchFiles(context, file);
    else context.addWatchFile(file);
  }
}

function extensionAssets() {
  let outputDirectory;
  return {
    name: "extension-assets",
    apply: "build",
    configResolved(config) {
      outputDirectory = path.resolve(config.root, config.build.outDir);
    },
    async buildStart() {
      for (const file of extensionFiles) {
        const source = path.join(extensionDirectory, file);
        if (file === "icons") await watchFiles(this, source);
        else this.addWatchFile(source);
      }
    },
    async writeBundle() {
      for (const file of extensionFiles) {
        await cp(path.join(extensionDirectory, file), path.join(outputDirectory, file), { recursive: true });
      }
    },
  };
}

export default defineConfig({
  base: "./",
  publicDir: false,
  plugins: [react(), extensionAssets()],
  build: {
    outDir: "dist",
    target: "es2022",
    rollupOptions: { input: path.join(root, "popup.html") },
  },
});
