import { defineConfig } from 'cypress'

export default defineConfig({
  projectId: 'qqogix',
  e2e: {
    baseUrl: 'http://localhost:3000',
    supportFile: false,
    video: true,
    screenshotOnRunFailure: true,
    viewportWidth: 1280,
    viewportHeight: 720,
    defaultCommandTimeout: 10000,
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
  },
  component: {
    devServer: {
      framework: 'vite',
      bundler: 'vite',
    },
  },
})
