const { defineConfig } = require("vite");

module.exports = defineConfig({
  root: ".",
  publicDir: false,
  build: {
    outDir: "dist-vite",
    emptyOutDir: true,
    rollupOptions: { input: "index.html" }
  }
});
