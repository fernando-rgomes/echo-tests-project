/**
 * @file follow_up.cy.js
 * @description Testes de fluxo ponta a ponta: Criação e Acompanhamento de denúncias.
 * @see {@link docs/TEST-PLAN.md} para a especificação completa dos casos de teste.
 */

describe('Fluxo de Acompanhamento de Denúncia', () => {

    // Setup: Garante que o usuário está logado antes de cada teste desta suíte
    beforeEach(() => {
        cy.login('fernando@teste.com', 'senha123');
    });

    /**
     * CENÁRIO: E2E-REP-02
     * Fluxo dinâmico que captura dados gerados pelo sistema para consulta posterior.
     */
    it('E2E-REP-02: Deve criar uma denúncia e conseguir acompanhá-la com as credenciais geradas', () => {
        cy.visit('/denuncia');
        
        // Preenchimento do formulário de denúncia
        cy.get('input[name="titulo"]').type('Denúncia para teste de acompanhamento');
        cy.get('select[name="categoria"]').select('ASSÉDIO');
        cy.get('#descricao').type('Descrição válida com mais de vinte caracteres para o teste de fluxo.');
        cy.get('button[type="submit"]').click();

        // CAPTURA: Armazena o Protocolo e Token gerados dinamicamente usando Aliases
        cy.get('.info-box').contains('Protocolo')
            .parent().find('.code-box span').invoke('text').then(t => t.trim()).as('protocoloGerado');

        cy.get('#token').invoke('text').then(t => t.trim()).as('tokenGerado');

        // NAVEGAÇÃO: Vai para a tela de acompanhamento
        cy.contains('Acompanhar').click();

        // EXECUÇÃO: Recupera os valores dos Aliases e preenche a consulta
        cy.get('@protocoloGerado').then((proto) => {
            cy.get('@tokenGerado').then((token) => {
                cy.get('#protocolo').type(proto);
                cy.get('#token').type(token);
                cy.get('button[type="submit"]').click();

                // VALIDAÇÃO: Confirma se os detalhes da denúncia correta são exibidos
                cy.url().should('include', '/acompanhar');
                cy.get('.detail-top h1').should('contain', proto);
            });
        });
    });

    /**
     * CENÁRIO: E2E-REP-04
     * Teste negativo para validar segurança do token de acompanhamento.
     */
    it('E2E-REP-04: Deve impedir acesso com código secreto incorreto', () => {
        cy.visit('/acompanhar');
        
        cy.get('#protocolo').type('ECH-999999'); 
        cy.get('#token').type('senha-errada');
        cy.get('button[type="submit"]').click();

        // Validação da mensagem de erro de segurança
        cy.get('.alert-error, .error').should('be.visible');
    });
});