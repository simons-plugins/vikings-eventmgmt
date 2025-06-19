describe('Viking Scouts Event Management', () => {
    beforeEach(() => {
        cy.visit('/');
        cy.wait(2000); // Give app time to initialize
    });

    describe('Authentication Flow', () => {
        it('should show login screen initially', () => {
            // Take a screenshot first to see what's rendering
            cy.screenshot('page-load');
            
            // Debug: Log what's actually on the page
            cy.get('body').then(($body) => {
                cy.log('Page title:', $body.find('title').text());
                cy.log('Body content:', $body.text());
                cy.log('All elements with id:', $body.find('[id]').map((i, el) => el.id).get().join(', '));
            });
            
            // Check if app is accessible
            cy.url().should('include', 'localhost:3000');
            
            // Check if page has any content
            cy.get('body').should('not.be.empty');
            
            // Look for any login-related elements
            cy.get('body').then(($body) => {
                if ($body.find('#osm-login-btn').length > 0) {
                    cy.log('Login button found!');
                } else {
                    cy.log('Login button NOT found');
                    cy.log('Available elements:', $body.find('*[id]').map((i, el) => el.tagName + '#' + el.id).get());
                }
            });
            
            // Try to find login button with longer timeout
            cy.get('#osm-login-btn', { timeout: 15000 }).should('exist');
        });

        it('should handle login button click', () => {
            cy.get('#osm-login-btn', { timeout: 15000 }).should('be.visible').click();
            cy.url().should('include', 'onlinescoutmanager.co.uk');
        });
    });
});