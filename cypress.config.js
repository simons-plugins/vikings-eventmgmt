import { defineConfig } from 'cypress'

export default defineConfig({
  projectId: 'qqogix',
  e2e: {
    baseUrl: 'https://localhost:3000',
    supportFile: false,
    video: true,
    screenshotOnRunFailure: true,
    viewportWidth: 1280,
    viewportHeight: 720,
    defaultCommandTimeout: 10000,
    pageLoadTimeout: 30000,
    requestTimeout: 10000,
    responseTimeout: 30000,
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
