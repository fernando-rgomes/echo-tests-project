# Projeto Echo - Estratégia e Automação de Testes

Este repositório centraliza a **estratégia de testes automatizados** aplicada ao sistema **Echo**, com foco na validação de comportamento, regras de negócio e fluxos críticos da aplicação.

---

## 🧠 Estratégia de Testes

Os testes foram estruturados em diferentes camadas para simular uma abordagem real de QA:

- **Testes de API** → validação de regras de negócio e contratos
- **Testes End-to-End (E2E)** → validação do fluxo do usuário final

Essa separação permite identificar falhas tanto no backend quanto na experiência do usuário.

---

## 📂 Arquitetura do Projeto

O projeto foi dividido em dois repositórios:

### 🔹 API (Spring Boot)
- API REST desenvolvida com **Spring Boot**
- Endpoints equivalentes ao sistema original
- Testes automatizados com **Rest Assured**

### 🔹 Aplicação Web (Javalin + Thymeleaf)
- Sistema original desenvolvido em **Javalin**
- Interface renderizada com **Thymeleaf**
- Testes E2E com **Cypress**

---

## 🧪 Abordagem de Testes

### 🔸 Testes de API
Focados na validação de:

- Status codes HTTP corretos
- Validação de entrada de dados
- Tratamento de erros
- Consistência das respostas

### 🔸 Testes End-to-End
Focados em fluxos reais do usuário:

- Cadastro de usuário
- Validação de formulário
- Exibição de dados na interface
- Comportamento em cenários de erro

---

## ⚠️ Cenários Críticos Testados

- Submissão de dados inválidos (campos vazios)
- Tentativa de cadastro com dados inconsistentes
- Comportamento da aplicação diante de erros
- Fluxos completos de interação do usuário

---

## 🎯 Objetivo

O objetivo deste projeto é demonstrar:

- Aplicação prática de testes em múltiplas camadas
- Pensamento analítico voltado à qualidade de software
- Uso de ferramentas modernas de automação
- Estruturação de testes baseada em cenários reais

---

## 🔗 Repositórios

- **Sistema Web (Echo):** [echo](https://github.com/aps-poo-ufpb/u3-projeto-4-echo.git)  
- **API para testes:** [echo_api](https://github.com/fernando-rgomes/echo-api.git)  

---

## 🚀 Tecnologias Utilizadas

- **Backend:** Javalin, Spring Boot  
- **Frontend:** Thymeleaf  
- **Testes de API:** Rest Assured  
- **Testes E2E:** Cypress  
- **Banco de Dados:** PostgreSQL / H2  
