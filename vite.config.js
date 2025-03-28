import { defineConfig } from "vite";
import { viteStaticCopy } from "vite-plugin-static-copy";
import * as path from "path";

export default defineConfig(({ command, mode, isSsrBuild, isPreview }) => {
  const buildInput = {
    main: path.resolve(__dirname, "src/js/main.js"),
    popup: path.resolve(__dirname, "src/static/popup.html"),
    index: path.resolve(__dirname, "src/static/index.html"),
  };

  return {
    root: "src/static",
    build: {
      outDir: "../../dist",
      emptyOutDir: true,
      rollupOptions: {
        input: buildInput,
        output: {
          entryFileNames: "[name]-[hash].js",
          chunkFileNames: "chunk-[hash].js",
          assetFileNames: "[name]-[hash].[ext]",
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
  };
});
