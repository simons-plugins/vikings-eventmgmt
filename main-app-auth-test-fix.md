// Quick fix for main-app-tests.cy.js authenticated flow test
// Replace the "should show main app interface when authenticated" test with this:

it('should show main app interface when authenticated', () => {
  // Set up authentication BEFORE visiting the page
  cy.window().then((win) => {
    win.sessionStorage.setItem('access_token', 'mock-test-token-123');
    win.sessionStorage.setItem('token_type', 'Bearer');
  });

  // Mock API calls with correct object format
  cy.intercept('GET', '**/get-user-roles', {
    statusCode: 200,
    body: {
      "0": {
        "sectionid": "49097", 
        "sectionname": "Thursday Beavers",
        "section": "beavers",
        "isDefault": "1",
        "permissions": { "badge": 20, "member": 20, "events": 20 }
      }
    }
  }).as('getUserRoles');

  cy.intercept('GET', '**/get-terms**', { statusCode: 200, body: {} });
  cy.intercept('GET', '**/get-events**', { statusCode: 200, body: [] });

  cy.visit('/');
  cy.wait('@getUserRoles');

  // Verify authenticated state
  cy.get('body').should('not.have.class', 'login-screen');
  cy.get('#sidebarToggle').should('be.visible');
  cy.get('#main-ui').should('be.visible');
});