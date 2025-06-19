describe('Connectivity Test', () => {
  it('can connect to the app', () => {
    cy.visit('/')
    cy.get('body').should('exist')
    cy.log('App is accessible')
  })
})