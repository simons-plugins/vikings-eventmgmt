// ***********************************************************
// This example support/e2e.js is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES6 syntax:
import './commands'

// Handle uncaught exceptions to prevent test failures from HTTPS cert issues
Cypress.on('uncaught:exception', (err, runnable) => {
  // Returning false here prevents Cypress from failing the test
  // for SSL/TLS certificate errors
  if (err.message.includes('certificate') || 
      err.message.includes('net::ERR_CERT') ||
      err.message.includes('SSL') ||
      err.message.includes('TLS')) {
    return false
  }
  
  // Don't fail on other network errors during development
  if (err.message.includes('socket hang up') ||
      err.message.includes('ECONNREFUSED') ||
      err.message.includes('network')) {
    return false
  }
})

// Add support for self-signed certificates
beforeEach(() => {
  cy.visit('/', {
    failOnStatusCode: false,
    timeout: 10000
  })
})