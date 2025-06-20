import { sentryVitePlugin } from "@sentry/vite-plugin";
// vite.config.js
import { defineConfig } from "vite";
import { resolve } from "path";
import basicSsl from "@vitejs/plugin-basic-ssl";

// Check if running in CI environment and adjust HTTPS accordingly
const isCI = process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true';

export default defineConfig({
  plugins: [
    basicSsl(),
    // Only include Sentry plugin in production build
    process.env.NODE_ENV === "production" &&
      sentryVitePlugin({
        org: "starmerclarkcom",
        project: "vikings-eventmgmt",
        // Sentry authentication token
        authToken: process.env.SENTRY_AUTH_TOKEN,
      }),
  ].filter(Boolean), // Filter out false values (when not in production)

  // Root directory (where index.html is)
  root: "src",

  // Build configuration
  build: {
    // Output directory (relative to project root, not src)
    outDir: "../dist",
    // Generate source maps for production (Sentry needs these)
    sourcemap: true,
    // Clean output directory before build
    emptyOutDir: true,

    rollupOptions: {
      input: {
        main: resolve(__dirname, "src/index.html"),
      },
    },
  },

  // Development server configuration
  server: {
    port: 3000,
    open: true, // Auto-open browser
    // Enable basic HTTPS (Vite will generate self-signed cert)
    https: !isCI,
    proxy: {
      "/api": {
        target: "http://localhost:5001",
        changeOrigin: true,
      },
    },
  },

  // Preview server (for testing production build)
  preview: {
    port: 3000,
  },

  // Define global constants
  define: {
    __SENTRY_RELEASE__: JSON.stringify(process.env.SENTRY_RELEASE || "dev"),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
  },
});
