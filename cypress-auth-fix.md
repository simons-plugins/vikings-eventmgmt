// Updated authentication setup for Cypress tests
// Replace the existing beforeEach block with this:

beforeEach(() => {
  // Set up proper authentication before each test
  cy.window().then((win) => {
    // Store the token in sessionStorage with the correct key
    win.sessionStorage.setItem('access_token', 'mock-test-token-123');
    win.sessionStorage.setItem('token_type', 'Bearer');
  });

  // Mock all the API calls that happen during authentication check
  cy.intercept('GET', '**/get-user-roles', {
    statusCode: 200,
    body: [
      {
        sectionid: '49097',
        sectionname: 'Thursday Beavers',
        section: 'beavers',
        isDefault: true,
        permissions: { badge: 20, member: 20, events: 20 }
      }
    ]
  }).as('getUserRoles');

  cy.intercept('GET', '**/get-terms**', {
    statusCode: 200,
    body: {
      '49097': [
        { termid: '1516164', name: 'Autumn 2024', enddate: '2024-12-15' }
      ]
    }
  }).as('getTerms');

  cy.intercept('GET', '**/get-events**', {
    statusCode: 200,
    body: [
      { eventid: '813460', name: 'Test Event 1', date: '2024-12-01' }
    ]
  }).as('getEvents');

  // Visit the page
  cy.visit('/');
  
  // Wait for authentication to complete
  cy.wait('@getUserRoles');
  
  // Ensure we're in authenticated state
  cy.get('body').should('not.have.class', 'login-screen');
  
  // Sidebar toggle should be visible in authenticated state
  cy.get('#sidebarToggle').should('exist').and('be.visible');
});