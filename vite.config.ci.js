import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    https: false, // No HTTPS for CI
    port: 3000
  },
  build: {
    outDir: 'dist'
  }
})