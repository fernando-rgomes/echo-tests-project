
Cypress.Commands.add('login', (usuario, senha) => {
  cy.visit('/login');
  cy.get('input[name="usuario"]').type(usuario);
  cy.get('input[name="senha"]').type(senha);
  cy.get('button[type="submit"]').click();
});