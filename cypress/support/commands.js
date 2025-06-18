// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

// Custom command to mock authenticated state
Cypress.Commands.add('mockAuthentication', () => {
  // Mock API responses for authenticated user with correct HTTP methods and formats
  cy.intercept('GET', '**/get-user-roles', {
    statusCode: 200,
    body: {
      "0": {
        "sectionid": "49097",
        "sectionname": "Thursday Beavers",
        "section": "beavers",
        "isDefault": "1",
        "permissions": { "badge": 20, "member": 20, "events": 20 }
      },
      "1": {
        "sectionid": "11113", 
        "sectionname": "Wednesday Beavers",
        "section": "beavers",
        "isDefault": "0",
        "permissions": { "badge": 20, "member": 20, "events": 20 }
      }
    }
  }).as('getUserRoles')

  cy.intercept('GET', '**/get-terms**', {
    statusCode: 200,
    body: {
      '49097': [
        { termid: '1516164', name: 'Autumn 2024', enddate: '2024-12-15' }
      ]
    }
  }).as('getTerms')

  cy.intercept('GET', '**/get-events**', {
    statusCode: 200,
    body: [
      { eventid: '813460', name: 'Test Event 1', date: '2024-12-01' }
    ]
  }).as('getEvents')

  // Set authentication token with correct format
  cy.window().then((win) => {
    win.sessionStorage.setItem('access_token', 'mock-valid-token')
    win.sessionStorage.setItem('token_type', 'Bearer')
  })
})

// Command to wait for app to load after authentication
Cypress.Commands.add('waitForAuthenticatedApp', () => {
  // Wait for authentication to complete first
  cy.wait('@getUserRoles')
  
  // Wait for the body to NOT have login-screen class (authenticated state)
  cy.get('body', { timeout: 10000 }).should('not.have.class', 'login-screen')
  
  // Wait for the sidebar toggle to appear (indicates main app is loaded)
  cy.get('#sidebarToggle', { timeout: 10000 }).should('be.visible')
  
  // Dismiss any error toasts that might appear
  cy.dismissErrorToasts()
  
  // Give app time to initialize
  cy.wait(1000)
  
  cy.log('Authenticated app interface loaded')
})

// Command to dismiss error toasts
Cypress.Commands.add('dismissErrorToasts', () => {
  cy.get('body').then(($body) => {
    if ($body.find('.error-toast').length > 0) {
      cy.get('.error-toast-close').click({ multiple: true })
      cy.wait(300) // Wait for toast to disappear
    }
  })
})

//
// -- This is a parent command --
// Cypress.Commands.add('login', (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })