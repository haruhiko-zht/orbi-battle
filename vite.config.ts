import { defineConfig } from "vite";

const repo = "orbi-battle";

export default defineConfig({
  base: process.env.GITHUB_ACTIONS ? `/${repo}/` : "/",
  server: { port: 5173 },
});
