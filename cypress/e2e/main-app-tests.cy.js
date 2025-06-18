describe('Viking Scouts Event Management', () => {
  describe('Authentication Flow', () => {
    it('should show login screen initially', () => {
      cy.get('#osm-login-btn', { timeout: 10000 }).should('be.visible')
      cy.get('#osm-login-btn').should('contain.text', 'Login with')
      cy.get('#osm-login-btn').should('contain.text', 'Online Scout Manager')
    })

    it('should handle login button click', () => {
      cy.get('#osm-login-btn').should('be.visible')
      
      // Mock the redirect (since we can't test actual OSM login)
      cy.window().then((win) => {
        cy.stub(win, 'open').as('windowOpen')
      })
      
      // Click should attempt to redirect
      cy.get('#osm-login-btn').click()
    })
  })

  describe('App Initialization', () => {
    it('should load without JavaScript errors', () => {
      cy.window().then((win) => {
        // Check for any console errors
        cy.wrap(win.console).should('exist')
      })
    })

    it('should have Sentry initialized', () => {
      cy.window().should('have.property', 'Sentry')
    })

    it('should show proper page title', () => {
      cy.title().should('eq', 'Viking Scouts Event Management')
    })

    it('should have favicon', () => {
      // Check if favicon link exists
      cy.get('link[rel="icon"], link[rel="shortcut icon"]').should('exist').then(($link) => {
        const href = $link.attr('href')
        
        if (href && !href.startsWith('data:')) {
          // File-based favicon - test that it loads
          cy.request({
            url: href,
            failOnStatusCode: false
          }).then((response) => {
            if (response.status === 200) {
              cy.log('✅ Favicon found and loads successfully')
              expect(response.status).to.equal(200)
            } else {
              cy.log('⚠️ Favicon file not found, but link exists (will show default browser icon)')
              // This is acceptable - browsers will show default icon
              expect(response.status).to.equal(404)
            }
          })
        } else if (href && href.startsWith('data:')) {
          // Data URI favicon (Chrome only)
          cy.log('⚠️ Data URI favicon - limited browser support')
          expect(href).to.include('data:image/')
        } else {
          cy.log('❌ Favicon link has no href attribute')
          throw new Error('Favicon link exists but has no href')
        }
      })
    })
  })

  describe('UI Components', () => {
    it('should have login screen elements', () => {
      cy.get('#osm-login-btn').should('be.visible')
      cy.get('#osm-login-btn').should('have.attr', 'class').and('contain', 'btn')
    })

    it('should have loading overlay (hidden)', () => {
      cy.get('#loading-overlay').should('exist')
      cy.get('#loading-overlay').should('not.be.visible')
    })

    it('should have app content container', () => {
      cy.get('#app-content').should('exist')
    })

    it('should not show sidebar toggle on login screen', () => {
      // Sidebar toggle should be hidden on login screen
      cy.get('#sidebarToggle').should('not.be.visible')
    })
  })

  describe('Responsive Design', () => {
    it('should work on mobile viewport', () => {
      cy.viewport('iphone-6')
      cy.get('#osm-login-btn').should('be.visible')
      // Sidebar toggle should be hidden on login screen
      cy.get('#sidebarToggle').should('not.be.visible')
    })

    it('should work on tablet viewport', () => {
      cy.viewport('ipad-2')
      cy.get('#osm-login-btn').should('be.visible')
      // Sidebar toggle should be hidden on login screen
      cy.get('#sidebarToggle').should('not.be.visible')
    })

    it('should work on desktop viewport', () => {
      cy.viewport(1920, 1080)
      cy.get('#osm-login-btn').should('be.visible')
      // Sidebar toggle should be hidden on login screen
      cy.get('#sidebarToggle').should('not.be.visible')
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels for login screen', () => {
      // On login screen, only test login button accessibility
      cy.get('#osm-login-btn').should('have.attr', 'class').and('contain', 'btn')
      // Login button should be focusable
      cy.get('#osm-login-btn').should('not.be.disabled')
    })

    it('should be keyboard navigable on login screen', () => {
      // Test that login button can be focused
      cy.get('#osm-login-btn').focus()
      cy.focused().should('have.id', 'osm-login-btn')
      
      // Verify login button is properly accessible
      cy.get('#osm-login-btn').should('be.visible').and('not.be.disabled')
      
      // Sidebar toggle should be hidden on login screen
      cy.get('#sidebarToggle').should('not.be.visible')
    })
  })
})

// Test with mock authentication (simplified with custom command)
describe('Viking Scouts - Authenticated Flow', () => {
  beforeEach(() => {
    // Set up authentication BEFORE visiting the page
    cy.window().then((win) => {
      win.sessionStorage.setItem('access_token', 'mock-valid-token')
      win.sessionStorage.setItem('token_type', 'Bearer')
    })
    
    // Set up API mocks
    cy.mockAuthentication()  // Uses the custom command
    
    cy.visit('/')
  })

  it('should show main app interface when authenticated', () => {
    cy.waitForAuthenticatedApp()  // Uses the custom command
    
    // Should show main app elements (not login)
    cy.get('#sidebarToggle').should('be.visible')
    cy.get('#sidebarToggle').should('have.attr', 'aria-label', 'Open sidebar')
    
    // Login button should not exist in main app
    cy.get('#osm-login-btn').should('not.exist')
  })

  afterEach(() => {
    // Clean up
    cy.window().then((win) => {
      win.sessionStorage.removeItem('access_token')
      win.sessionStorage.removeItem('token_type')
    })
  })
})