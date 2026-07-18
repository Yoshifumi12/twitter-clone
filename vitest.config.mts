import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    exclude: ["**/node_modules/**", "**/e2e/**"],
    env: {
      AUTH0_DOMAIN: "test.auth0.local",
      AUTH0_CLIENT_ID: "test-client-id",
      AUTH0_CLIENT_SECRET: "test-client-secret",
      AUTH0_DB_CONNECTION: "Username-Password-Authentication",
    },
  },
});
