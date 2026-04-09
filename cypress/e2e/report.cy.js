/**
 * @file report.cy.js
 * @description Testes de ponta a ponta para o formulário de denúncias.
 * Abrange o fluxo de criação (Happy Path) e validações de regras de negócio (Edge Cases).
 * @see {@link docs/TEST-PLAN.md} para a especificação completa dos casos de teste.
 */

describe('Fluxo de Denúncias - Echo Original', () => {

  /**
   * @description Setup inicial para os testes de denúncia.
   * Garante que o usuário esteja autenticado e na página correta antes de cada cenário.
   */
  beforeEach(() => {
    // Realiza o login via comando customizado e navega para a rota de formulário
    cy.login('fernando@teste.com', 'senha123');
    cy.visit('/denuncia'); 
  });

  /**
   * CENÁRIO: E2E-REP-01 - Envio de Denúncia com Sucesso
   * @objective Validar se o sistema processa o envio e gera as credenciais de acompanhamento.
   * @requirement RF-002 (Criação de Denúncia Anônima)
   */
  it('E2E-REP-01: Deve criar uma denúncia com sucesso e exibir o protocolo e código secreto', () => {
    // 1. AÇÃO: Preenchimento do Formulário
    cy.get('input[name="titulo"]').type('Denúncia de Teste');
    
    // Seleção de categoria via valor do Option (mapeado do Thymeleaf)
    cy.get('select[name="categoria"]').select('CORRUPÇÃO');

    // Inserção de descrição respeitando o limite mínimo de 20 caracteres
    const descricaoValida = 'Esta é uma descrição detalhada com mais de vinte caracteres para passar na validação.';
    cy.get('#descricao').type(descricaoValida);

    // 2. EXECUÇÃO: Submissão do formulário
    cy.get('button[type="submit"]').contains('Enviar Denúncia').click();

    // 3. VALIDAÇÃO: Verificação da tela de sucesso e persistência
    cy.get('.success-container').should('be.visible');
    cy.contains('Denúncia Enviada com Sucesso!').should('be.visible');

    // 4. INTEGRIDADE: Garante que o protocolo foi gerado e renderizado corretamente
    cy.get('.info-box').contains('Protocolo')
      .parent()
      .find('.code-box span')
      .should('not.be.empty')
      .invoke('text')
      .then((protocolo) => {
        cy.log('Protocolo Gerado: ' + protocolo);
      });

    // 5. SEGURANÇA: Verifica a existência do Token (Código Secreto)
    cy.get('#token').should('exist').and('not.be.empty');
  });

  /**
   * CENÁRIO: E2E-REP-03 - Validação de Campo Obrigatório/Tamanho
   * @objective Garantir que o sistema impeça o envio de denúncias com descrições insuficientes.
   * @type Teste Negativo
   */
  it('E2E-REP-03: Deve exibir erro de validação para descrição curta', () => {
    // 1. AÇÃO: Preenchimento parcial (sem título, conforme regra de opcionalidade)
    cy.get('select[name="categoria"]').select('FRAUDE');
    cy.get('#descricao').type('Muito curta'); // Payload inválido (< 20 caracteres)
    
    // 2. EXECUÇÃO: Tentativa de envio
    cy.get('button[type="submit"]').click();

    // 3. VALIDAÇÃO: Feedback de erro do Backend/Thymeleaf
    cy.get('.error').should('be.visible');
    cy.contains('Descrição deve ter no mínimo 20 caracteres').should('be.visible');
  });

});