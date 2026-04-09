/**
 * @file admin_security.cy.js
 * @description Testes de autorização e visibilidade baseada em perfis (ADMIN vs USER).
 * @see {@link docs/TEST-PLAN.md} para a especificação completa dos casos de teste.
 */

describe('Segurança e Autorização - Perfil Admin', () => {

    it('E2E-RBAC-01: Admin deve visualizar links exclusivos na Navbar', () => {
        // Logando como Admin (Certifique-se que este usuário tem ROLE_ADMIN no banco)
        cy.login('admin@echo.com', 'admin123'); 
        cy.visit('/');

        cy.get('.nav-links').within(() => {
            // Admin vê estes:
            cy.contains('Denúncias').should('be.visible');
            cy.contains('Usuários').should('be.visible');
            
            // Admin NÃO vê estes (que são de User):
            cy.contains('Denunciar').should('not.exist');
            cy.contains('Acompanhar').should('not.exist');
        });
        
        // Valida se a badge de role está correta
        cy.get('.user-info .role').should('contain', 'ADMIN');
    });

    it('E2E-RBAC-02: Usuário comum NÃO deve visualizar links de Admin', () => {
        cy.login('fernando@teste.com', 'senha123');
        cy.visit('/');

        cy.get('.nav-links').within(() => {
            // User vê estes:
            cy.contains('Denunciar').should('be.visible');
            cy.contains('Acompanhar').should('be.visible');
            
            // User NÃO vê estes:
            cy.contains('Denúncias').should('not.exist');
            cy.contains('Usuários').should('not.exist');
        });
    });

    it('E2E-RBAC-03: Bloqueio de acesso forçado para rota administrativa', () => {
        cy.login('fernando@teste.com', 'senha123');

        // Tentativa de "sequestro" de URL
        // Usamos failOnStatusCode: false para o Cypress não travar no erro 403
        cy.visit('/admin/usuarios', { failOnStatusCode: false });

        // Validação da tela de erro (Ajuste conforme o texto que aparece na sua tela)
        cy.contains('Acesso Negado').should('be.visible'); 
        // Se o seu servidor retorna status 403 real:
        // cy.request({url: '/admin/usuarios', failOnStatusCode: false}).its('status').should('equal', 403);
    });
});