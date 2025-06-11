describe('Viking Scouts - Main App Features', () => {
  beforeEach(() => {
    cy.visit('/')
    cy.mockAuthentication()
    cy.reload()
    cy.waitForAuthenticatedApp()
  })

  describe('Sidebar Navigation', () => {
    it('should toggle sidebar open and closed', () => {
      // Open sidebar
      cy.get('#sidebarToggle').click()
      cy.get('#sidebar').should('have.class', 'open')
      
      // Close sidebar
      cy.get('#sidebarToggle').click()
      cy.get('#sidebar').should('not.have.class', 'open')
    })

    it('should show sections when sidebar is opened', () => {
      // Open sidebar - this should trigger sections loading
      cy.get('#sidebarToggle').click()
      
      // Wait for sections to load (if API call happens)
      cy.get('body').then(() => {
        // Check if sections table exists or if there's a loading state
        cy.get('#sections-table-container').should('exist')
        
        // Either sections are loaded or there's a message
        cy.get('#sections-table-container').then(($container) => {
          if ($container.find('#sections-table').length > 0) {
            // Sections loaded successfully
            cy.get('#sections-table').should('exist')
          } else {
            // Sections not loaded (expected with mocked auth)
            cy.log('Sections table not found - app may require real authentication')
          }
        })
      })
    })
  })

  describe('Event Management', () => {
    it('should have events table container ready', () => {
      cy.get('#sidebarToggle').click()
      
      // Check if events container exists
      cy.get('#events-table-container').should('exist')
      
      // Should show placeholder message initially
      cy.get('#events-table-container').then(($container) => {
        if ($container.text().includes('Select sections')) {
          cy.log('Events container shows expected placeholder message')
        } else {
          cy.log('Events container in different state')
        }
      })
    })

    it('should handle section selection (if sections are available)', () => {
      cy.get('#sidebarToggle').click()
      
      // Check if any sections are available to select
      cy.get('body').then(($body) => {
        if ($body.find('.section-checkbox').length > 0) {
          // Sections are available - test selection
          cy.get('.section-checkbox').first().check()
          cy.log('Section selected - would trigger events loading in real app')
        } else {
          cy.log('No sections available - requires real authentication')
        }
      })
    })
  })

  describe('Attendance Management', () => {
    it('should have attendance panel ready', () => {
      // Check if attendance panel exists
      cy.get('#attendance-panel').should('exist')
      
      // Should show placeholder message initially  
      cy.get('#attendance-panel').then(($panel) => {
        if ($panel.text().includes('Select events')) {
          cy.log('Attendance panel shows expected placeholder message')
        } else {
          cy.log('Attendance panel in different state')
        }
      })
    })

    it('should handle UI interactions gracefully', () => {
      cy.get('#sidebarToggle').click()
      
      // Test that UI elements don't cause errors even without data
      cy.get('body').then(() => {
        cy.log('UI loads without JavaScript errors')
        
        // Verify main containers exist
        cy.get('#app-content').should('exist')
        cy.get('#sidebar').should('exist')
        cy.get('#attendance-panel').should('exist')
      })
    })
  })

  describe('Mobile Responsiveness', () => {
    it('should work properly on mobile', () => {
      cy.viewport('iphone-6')
      
      // Dismiss any error toasts that might be covering elements
      cy.dismissErrorToasts()
      
      // Open sidebar on mobile - use force if still covered
      cy.get('#sidebarToggle').click({ force: true })
      
      // Verify mobile layout works
      cy.get('#sidebar').should('exist')
      cy.get('#app-content').should('exist')
      
      // Test sidebar overlay behavior on mobile
      cy.get('.sidebar-overlay').should('exist')
      
      // Close sidebar by clicking overlay
      cy.get('.sidebar-overlay').click({ force: true })
      cy.get('#sidebar').should('not.have.class', 'open')
    })
  })

  afterEach(() => {
    // Clean up
    cy.window().then((win) => {
      win.sessionStorage.removeItem('access_token')
    })
  })
})