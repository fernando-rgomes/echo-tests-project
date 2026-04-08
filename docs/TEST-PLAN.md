# 📋 Plano de Testes - Projeto Echo

## 🎯 Objetivo

Definir a estratégia de testes para validar a qualidade do sistema Echo, garantindo que as principais funcionalidades estejam corretas, seguras e consistentes.

---

## 🧠 Escopo

Serão testadas as seguintes funcionalidades:

- Cadastro de usuário
- Listagem de usuários
- Validação de formulário
- Comportamento da aplicação em cenários de erro

---

## 🧪 Tipos de Teste

### 🔸 Testes de API
Realizados na API desenvolvida em Spring Boot.

Objetivos:
- Validar regras de negócio
- Garantir uso correto de status HTTP
- Verificar tratamento de erros

Ferramenta:
- Rest Assured

---

### 🔸 Testes End-to-End (E2E)
Realizados na aplicação web com Thymeleaf.

Objetivos:
- Validar fluxo do usuário
- Garantir integração entre interface e backend
- Testar comportamento visual e interações

Ferramenta:
- Cypress

---

## ⚠️ Riscos Identificados

- Falha na validação de entrada de dados
- Inconsistência na persistência de dados
- Falhas na exibição de informações na interface
- Submissão de formulários com dados inválidos

---

## 🧩 Estratégia

Os testes foram organizados em dois níveis:

1. API → valida lógica e regras
2. E2E → valida comportamento do usuário

Essa abordagem permite detectar falhas em diferentes camadas do sistema.

---

## 🚀 Critérios de Sucesso

- Todos os testes automatizados executando com sucesso
- Nenhum erro crítico nas funcionalidades principais
- Respostas da API com status codes corretos


# 🧪 Cobertura de Testes Automatizados

A garantia de qualidade desta API foi construída utilizando **JUnit 5** e **Rest Assured**, garantindo que as regras de negócio de anonimato e validação funcionem perfeitamente. Os testes rodam de forma isolada utilizando um banco de dados **H2 em memória**.

## 📍 Endpoint: `/users` (Cadastro de Denunciante)

| Cenário de Teste | Tipo de Teste | Dados de Entrada | Resultado Esperado | Status HTTP | Status |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **Deve cadastrar usuário válido** | Integração (API) | E-mail válido e senha preenchida | Usuário criado. Retorna UUID, email e role. Omite a senha. | `201 Created` | ✅ |
| **Erro: Senha em branco** | Integração (API) | E-mail válido e senha vazia | Bloqueia requisição. Retorna erro no campo "senha". | `400 Bad Request` | ✅ |
| **Erro: E-mail inválido** | Integração (API) | E-mail sem formato e senha preenchida | Bloqueia requisição. Retorna erro no campo "email". | `400 Bad Request` | ⏳ Todo |
| **Erro: Todos os campos vazios** | Integração (API) | E-mail vazio e senha vazia | Retorna lista de erros apontando falha em ambos os campos. | `400 Bad Request` | ⏳ Todo |
| **Erro: E-mail duplicado** | Integração (API) | E-mail já existente no sistema | Bloqueia requisição informando conflito de dados. | `409 Conflict` | ⏳ Todo |