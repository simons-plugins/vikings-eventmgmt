import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.js']
  },
  define: {
    'import.meta.env.VITE_API_URL': '"https://vikings-osm-event-manager.onrender.com"',
    'import.meta.env.VITE_NODE_ENV': '"test"',
    'import.meta.env.DEV': false
  }
})