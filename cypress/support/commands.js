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
  // Mock API responses for authenticated user
  cy.intercept('POST', '**/get-user-roles', {
    statusCode: 200,
    body: {
      items: [
        { sectionid: '1', sectionname: 'Cubs', rolename: 'Leader' },
        { sectionid: '2', sectionname: 'Scouts', rolename: 'Leader' }
      ]
    }
  }).as('getUserRoles')

  cy.intercept('POST', '**/get-sections', {
    statusCode: 200,
    body: {
      items: [
        { sectionid: '1', sectionname: '1st Test Cubs' },
        { sectionid: '2', sectionname: '1st Test Scouts' }
      ]
    }
  }).as('getSections')

  cy.intercept('POST', '**/get-events', {
    statusCode: 200,
    body: {
      items: [
        {
          eventid: '1',
          name: 'Test Camp',
          startdate: '2024-06-01',
          sectionname: '1st Test Cubs',
          yes: 15,
          no: 3,
          yes_members: 12,
          yes_yls: 2,
          yes_leaders: 1
        }
      ]
    }
  }).as('getEvents')

  cy.intercept('POST', '**/get-attendees', {
    statusCode: 200,
    body: {
      items: [
        {
          scoutid: '1',
          firstname: 'John',
          lastname: 'Smith',
          attending: 'Yes',
          sectionname: '1st Test Cubs'
        },
        {
          scoutid: '2',
          firstname: 'Jane',
          lastname: 'Doe',
          attending: 'No',
          sectionname: '1st Test Cubs'
        }
      ]
    }
  }).as('getAttendees')

  // Set authentication token
  cy.window().then((win) => {
    win.sessionStorage.setItem('access_token', 'mock-valid-token')
  })
})

// Command to wait for app to load after authentication
Cypress.Commands.add('waitForAuthenticatedApp', () => {
  // Wait for the sidebar toggle to appear (indicates main app is loaded)
  cy.get('#sidebarToggle', { timeout: 10000 }).should('be.visible')
  
  // Dismiss any error toasts that might appear
  cy.dismissErrorToasts()
  
  // Give app time to initialize (without waiting for specific API calls)
  cy.wait(1000)
  
  // Optionally wait for user roles if the app actually makes that call
  cy.get('body').then(() => {
    // App is ready for testing
    cy.log('Authenticated app interface loaded')
  })
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