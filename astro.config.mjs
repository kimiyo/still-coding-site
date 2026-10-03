import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://still-coding.com",
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
