import { defineConfig } from 'vite';
import { sentryVitePlugin } from "@sentry/vite-plugin";

export default defineConfig({
  root: 'src',
  build: {
    outDir: '../dist',
    sourcemap: true, // Generate source maps
    rollupOptions: {
      input: {
        main: 'src/index.html',
        callback: 'src/callback.html'
      }
    }
  },
  server: {
    port: 3000,
    https: true
  },
  plugins: [
    // Upload source maps to Sentry during build
    sentryVitePlugin({
      org: "vikings-scout-group",
      project: "vikings-eventmgmt",
      authToken: process.env.SENTRY_AUTH_TOKEN,
      
      // Only upload source maps in production
      include: "./dist",
      ignore: ["node_modules"],
      
      // Create releases
      release: {
        name: `vikings-eventmgmt@${process.env.npm_package_version || '1.0.0'}`,
        uploadLegacySourcemaps: true
      }
    })
  ]
});