import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

const repo = "orbi-battle";

export default defineConfig({
  plugins: [react()],
  base: process.env.GITHUB_ACTIONS ? `/${repo}/` : "/",
  server: { port: 5173 },
  test: {
    globals: true,
    // デフォルトはhappy-dom（UIテスト用）
    environment: "happy-dom",
    pool: "threads",
  },
});
