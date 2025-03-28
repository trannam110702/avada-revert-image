import { defineConfig } from "vite";
import { viteStaticCopy } from "vite-plugin-static-copy";
import * as path from "path";

export default defineConfig({
  root: "src/static",
  build: {
    outDir: "../../dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        popup: path.resolve(__dirname, "src/static/popup.html"),
        main: path.resolve(__dirname, "src/js/main.js"),
      },
      output: {
        entryFileNames: "[name].js",
        chunkFileNames: "chunk.js",
        assetFileNames: "[name].[ext]",
      },
    },
  },
  resolve: {
    alias: {
      "@js": path.resolve(__dirname, "./src/js"),
    },
  },
  plugins: [
    viteStaticCopy({
      targets: [
        {
          src: path.resolve(__dirname, "src/static/manifest.json"),
          dest: path.resolve(__dirname, "dist"),
        },
      ],
    }),
  ],
});
