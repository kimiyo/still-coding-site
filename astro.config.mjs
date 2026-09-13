import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://still-coding.cc",
  output: "static",
  build: {
    assets: "assets",
  },
  vite: {
    build: {
      cssMinify: "lightningcss",
    },
  },
});
