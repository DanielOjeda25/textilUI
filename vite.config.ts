import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],

  server: {
    open: true,
    port: 5173,
  },

  resolve: {
    alias: {
      "@": "/src",
    },
  },

  // Soporte para WASM + web workers
  optimizeDeps: {
    exclude: ["onnxruntime-web", "@imagemagick/magick-wasm"],
  },

  build: {
    target: "esnext",
    sourcemap: true,
    outDir: "dist",

    rollupOptions: {
      output: {
        manualChunks: {
          wasm: ["onnxruntime-web", "@imagemagick/magick-wasm"],
          konva: ["konva", "react-konva"],
        },
      },
    },
  },

  // Permitir importar WASM de forma asíncrona
  assetsInclude: ["**/*.wasm"],
});
