/**
 * @file auth.cy.js
 * @description Testes de Autenticação. Valida o acesso de usuários e mensagens de erro.
 * @see {@link docs/TEST-PLAN.md} para a especificação completa dos casos de teste.
 */

describe('Fluxo de Autenticação', () => {

  /**
   * CENÁRIO: E2E-AUTH-01
   * Valida o acesso bem-sucedido à plataforma.
   */
  it('E2E-AUTH-01: Deve realizar login com sucesso e redirecionar para a Home', () => {
    // 1. Executa o login via comando customizado
    cy.login('fernando@teste.com', 'senha123')

    // 2. Validações de estado pós-login
    cy.url().should('include', '/');
    cy.contains('ECHO - Plataforma de Ouvidoria Anônima').should('be.visible');
  });

  /**
   * CENÁRIO: E2E-AUTH-03
   * Valida o bloqueio de acesso para credenciais incorretas.
   */
  it('E2E-AUTH-03: Deve exibir erro ao inserir credenciais inválidas', () => {
    // 1. Tentativa de login com dados incorretos
    cy.login('errado@teste.com', 'senhaFalsa');

    // 2. Validação da mensagem de feedback de erro
    cy.contains('Usuário ou senha inválidos').should('be.visible');
  });

});