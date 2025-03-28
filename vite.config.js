import { defineConfig, transformWithEsbuild } from "vite";
import { viteStaticCopy } from "vite-plugin-static-copy";
import * as path from "path";

export default defineConfig(({ command, mode, isSsrBuild, isPreview }) => {
  const buildInput = {
    main: path.resolve(__dirname, "src/js/main.js"),
    background: path.resolve(__dirname, "src/js/background.js"),
    contentScript: path.resolve(__dirname, "src/js/content-script.js"),
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
            if (
              chunkInfo.name === "background" ||
              chunkInfo.name === "contentScript"
            ) {
              return "[name].js";
            }
            return "assets/[name]-[hash].js";
          },
          chunkFileNames: "chunk-[hash].js",
          assetFileNames: "[name].[ext]",
        },
      },
    },
    optimizeDeps: {
      force: true,
      esbuildOptions: {
        loader: {
          ".js": "jsx",
        },
        define: {
          global: "globalThis",
        },
      },
    },
    resolve: {
      alias: {
        "@js": path.resolve(__dirname, "./src/js"),
        react: "preact/compat",
        "react-dom": "preact/compat",
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
      {
        name: "treat-js-files-as-jsx",
        async transform(code, id) {
          if (!id.match(/src\/.*\.js$/)) return null;

          return transformWithEsbuild(code, id, {
            loader: "jsx",
            jsx: "automatic",
          });
        },
      },
    ],
  };
});
