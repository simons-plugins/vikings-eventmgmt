describe('Viking Scouts Event Management', () => {
    beforeEach(() => {
        cy.visit('/');
    });

    describe('Authentication Flow', () => {
        it('should show login screen initially', () => {
            // Debug: Log what's actually on the page
            cy.get('body').then(($body) => {
                cy.log('Page title:', $body.find('title').text());
                cy.log('Body HTML:', $body.html());
            });
            
            // Check if app container exists first
            cy.get('body').should('be.visible');
            
            // Wait longer and check for login button
            cy.get('#osm-login-btn', { timeout: 15000 }).should('exist');
        });

        it('should handle login button click', () => {
            cy.get('#osm-login-btn', { timeout: 15000 }).should('be.visible').click();
            // Should redirect to OAuth provider
            cy.url().should('include', 'onlinescoutmanager.co.uk');
        });
    });
});