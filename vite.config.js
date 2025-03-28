import { defineConfig } from "vite";
import { viteStaticCopy } from "vite-plugin-static-copy";
import * as path from "path";

export default defineConfig(({ command, mode, isSsrBuild, isPreview }) => {
  const buildInput = {
    main: path.resolve(__dirname, "src/js/main.js"),
    background: path.resolve(__dirname, "src/js/background.js"),
    popup: path.resolve(__dirname, "src/popup.html"),
    index: path.resolve(__dirname, "src/index.html"),
  };

  return {
    root: "src",
    build: {
      outDir: "../dist",
      emptyOutDir: true,
      rollupOptions: {
        input: buildInput,
        output: {
          entryFileNames: (chunkInfo) => {
            if (chunkInfo.name === "background") {
              return "background.js";
            }
            return "assets/[name]-[hash].js";
          },
          chunkFileNames: "chunk-[hash].js",
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
  };
});
