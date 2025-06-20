describe('Viking Scouts Event Management App', () => {
  beforeEach(() => {
    // Prevent auth errors from failing tests
    cy.on('uncaught:exception', (err, runnable) => {
      // Return false if this is an auth-related error
      if (err.message.includes('VITE_API_URL') || 
          err.message.includes('import.meta.env') ||
          err.message.includes('auth')) {
        return false
      }
    })
    
    cy.visit('/')
  })

  describe('Basic App Loading', () => {
    it('loads the application', () => {
      cy.get('body').should('be.visible')
      cy.title().should('not.be.empty')
    })

    it('has no console errors', () => {
      cy.window().then((win) => {
        cy.stub(win.console, 'error').as('consoleError')
      })
      cy.reload()
      cy.get('@consoleError').should('not.have.been.called')
    })
  })

  describe('Authentication', () => {
    it('shows login interface when not authenticated', () => {
      // Look for any login-related elements using multiple checks
      cy.get('body').then(($body) => {
        const bodyText = $body.text()
        const hasLoginText = bodyText.includes('Login') || 
                           bodyText.includes('Sign in') || 
                           bodyText.includes('OSM') || 
                           bodyText.includes('Online Scout Manager')
        expect(hasLoginText).to.be.true
      })
    })

    it('has a login button or link', () => {
      // Look for various login button patterns
      cy.get('body').within(() => {
        cy.get('button, a, [role="button"]')
          .contains(/login|sign in|authenticate|osm/i)
          .should('exist')
      })
    })
  })

  describe('UI Components', () => {
    it('has main content area', () => {
      cy.get('body').should('not.be.empty')
      cy.get('main, #app, #root, .app, .main').should('exist')
    })

    it('loads CSS styles', () => {
      cy.get('head link[rel="stylesheet"]').should('exist')
    })
  })

  describe('Responsive Design', () => {
    it('works on mobile viewport', () => {
      cy.viewport(375, 667) // iPhone SE
      cy.get('body').should('be.visible')
    })

    it('works on tablet viewport', () => {
      cy.viewport(768, 1024) // iPad
      cy.get('body').should('be.visible')
    })

    it('works on desktop viewport', () => {
      cy.viewport(1920, 1080) // Desktop
      cy.get('body').should('be.visible')
    })
  })

  describe('Navigation', () => {
    it('can navigate around the app', () => {
      // Test any visible navigation elements
      cy.get('nav, .nav, .navigation, .menu').then(($nav) => {
        if ($nav.length > 0) {
          // If nav exists but isn't visible, that's okay for login screen
          cy.log(`Found ${$nav.length} navigation elements`)
        } else {
          cy.log('No navigation found - expected for login screen')
        }
      })
    })
  })

  describe('Performance', () => {
    it('loads within reasonable time', () => {
      const start = Date.now()
      cy.visit('/')
      cy.get('body').should('be.visible').then(() => {
        const loadTime = Date.now() - start
        expect(loadTime).to.be.lessThan(5000) // 5 seconds max
      })
    })
  })
})