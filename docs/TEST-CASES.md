# ⚙️ Casos de Teste de Integração (API Backend)
> **Nota:** Os casos de teste identificados como USER, AUTH, RBAC e REPORT (Integração) são validados via Rest Assured no repositório Echo-api, enquanto os casos E2E são validados via Cypress neste repositório.*


**Foco:** Validação de regras de negócio, segurança e persistência no nível do servidor (Spring Boot).

**Ferramenta:** RestAssured

## 📍 Endpoint: `/users` (Cadastro de Denunciante)

| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Identificação&nbsp;&nbsp;&nbsp;&nbsp; | Cenário de Teste | Tipo de Teste | Dados de Entrada | Resultado Esperado | Status HTTP | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| **`USER-001`** | **Deve cadastrar usuário válido** | Integração (API) | E-mail válido e senha preenchida | Usuário criado. Retorna UUID, email e role. Omite a senha. | `201 Created` | ✅ |
| **`USER-002`** | **Erro: Senha em branco** | Integração (API) | E-mail válido e senha vazia | Bloqueia requisição. Retorna erro no campo "password". | `400 Bad Request` | ✅ |
| **`USER-003`** | **Erro: E-mail inválido** | Integração (API) | E-mail sem formato e senha preenchida | Bloqueia requisição. Retorna erro no campo "email". | `400 Bad Request` | ✅ |
| **`USER-004`** | **Erro: Email em branco** | Integração (API) | E-mail válido e senha vazia | Bloqueia requisição. Retorna erro no campo "email". | `400 Bad Request` | ✅ |
| **`USER-005`** | **Erro: Todos os campos vazios** | Integração (API) | E-mail vazio e senha vazia | Retorna lista de erros apontando falha em ambos os campos. | `400 Bad Request` | ✅ |
| **`USER-006`** | **Erro: E-mail duplicado** | Integração (API) | E-mail já existente no sistema | Bloqueia requisição informando conflito de dados. | `409 Conflict` | ✅ |

---

## 🔐 Endpoint: `/users` (Listagem com Regra de Negócio RBAC)

| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Identificação&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; | Cenário de Teste | Tipo de Teste | Dados de Entrada | Resultado Esperado | Status HTTP | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| **`RBAC-001`** | **Acesso permitido para Admin** | Integração (API) | Token válido de usuário com `ROLE_ADMIN` | Permite o acesso. Retorna lista de usuários com tamanho `>= 1`. | `200 OK` | ✅ |
| **`RBAC-002`** | **Erro: Bloqueio sem Token** | Integração (API) | Requisição GET sem header `Authorization` | Retorna erro customizado: *"Acesso negado. Você precisa estar logado..."* | `403 Forbidden` | ✅ |
| **`RBAC-003`** | **Erro: Falta de Permissão** | Integração (API) | Token válido de usuário com `ROLE_USER` | Retorna erro customizado: *"Acesso negado. Você não tem permissão..."* | `403 Forbidden` | ✅ |

---

## 📍 Endpoint: `/login` (Autenticação e Geração de Token)

| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Identificação&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; | Cenário de Teste | Tipo de Teste | Dados de Entrada | Resultado Esperado | Status HTTP | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| **`AUTH-001`** | **Login com Sucesso** | Integração (API) | E-mail existente e senha correta | Retorna JSON contendo o Token JWT. | `200 OK` | ✅ |
| **`AUTH-002`** | **Erro: Senha Incorreta** | Integração (API) | E-mail existente e senha incorreta | Bloqueia acesso. Retorna mensagem genérica de segurança. | `403 Forbidden` | ✅ |
| **`AUTH-003`** | **Erro: Usuário Inexistente** | Integração (API) | E-mail não cadastrado na base | Bloqueia acesso. Retorna mensagem genérica para evitar enumeração. | `403 Forbidden` | ⏳ Todo |

---

## 📍 Endpoint: `/reports` (Gestão de Denúncias)

| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Identificação&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; | Cenário de Teste | Tipo de Teste | Dados de Entrada | Resultado Esperado | Status HTTP | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| **`REPORT-001`** | **Criar denúncia logado** | Integração (API) | Token válido + Dados da denúncia | Denúncia criada e vinculada ao usuário logado. Retorna Protocolo e Secret. | `201 Created` | ✅ |
| **`REPORT-002`** | **Erro: Denúncia sem login** | Integração (API) | Dados da denúncia (sem Header) | Bloqueia a criação por falta de autenticação. | `403 Forbidden` | ✅ |
| **`REPORT-003`** | **Erro: Descrição curta** | Integração (API) | Token válido + Descrição < 20 chars | Bloqueia por violação de regra de validação. | `400 Bad Request` | ✅ |
| **`REPORT-006`** | **Erro: Categoria inválida** | Integração (API) | Token válido + Categoria fora do Enum | Bloqueia falha de conversão e retorna erro de formatação. | `400 Bad Request` | ✅ |
| **`REPORT-004`** | **Acompanhar com sucesso** | Integração (API) | Protocolo + Secret corretos | Retorna os detalhes e o status atual da denúncia. | `200 OK` | ✅ |
| **`REPORT-005`** | **Erro: Acompanhar Secret Inválido**| Integração (API) | Protocolo correto + Secret errado | Bloqueia o acesso aos detalhes da denúncia. | `401 Unauthorized`| ✅ |

<br>

---

<br>

# 🧪 Casos de Teste Automatizados (E2E Frontend)

**Ferramenta de Automação:** Cypress

**Cobertura:** Autenticação, Fluxo de Denúncias e Controle de Acesso (RBAC) via Interface de Usuário.

## 🔐 1. Módulo de Autenticação (`auth.cy.js`)

| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Identificação&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; | Cenário | Pré-condição | Passos | Resultado Esperado | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **E2E-AUTH-01** | Login com credenciais válidas | Usuário cadastrado no banco (`USER`) | 1. Acessar `/login`<br>2. Inserir email e senha válidos<br>3. Clicar em "Entrar" | Redirecionamento para a Home (`/`). Mensagem de boas-vindas visível. | ✅ Automatizado |
| **E2E-AUTH-03** | Erro ao inserir credenciais inválidas | N/A | 1. Acessar `/login`<br>2. Inserir email ou senha incorretos<br>3. Clicar em "Entrar" | Acesso bloqueado. Alerta de erro "Usuário ou senha inválidos" exibido. | ✅ Automatizado |

---

## 📢 2. Módulo de Denúncias e Acompanhamento (`report.cy.js` & `follow_up.cy.js`)

| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Identificação&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; | Cenário | Pré-condição | Passos | Resultado Esperado | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **E2E-REP-01** | Criar denúncia com sucesso via Formulário | Usuário logado (`USER`) | 1. Acessar `/denuncia`<br>2. Preencher Título, Categoria e Descrição (>20 char)<br>3. Submeter formulário | Tela de sucesso exibida. Protocolo e Código Secreto gerados e renderizados na tela. | ✅ Automatizado |
| **E2E-REP-03** | Exibir erro de validação para descrição curta | Usuário logado (`USER`) | 1. Acessar `/denuncia`<br>2. Preencher descrição com menos de 20 caracteres<br>3. Submeter formulário | Envio bloqueado. Mensagem de erro informando o limite mínimo exigido é exibida. | ✅ Automatizado |
| **E2E-REP-02** | Acompanhar denúncia com credenciais geradas | Usuário logado (`USER`), denúncia recém-criada no teste | 1. Extrair Protocolo e Token gerados dinamicamente<br>2. Acessar `/acompanhar`<br>3. Preencher campos com os dados extraídos<br>4. Buscar | Tela de detalhes da denúncia carregada corretamente. Status inicial "PENDENTE" validado. | ✅ Automatizado |
| **E2E-REP-04** | Exibir erro com código secreto inválido | Usuário logado (`USER`), denúncia existente | 1. Acessar `/acompanhar`<br>2. Inserir protocolo válido e token incorreto<br>3. Buscar | Acesso negado. Mensagem de erro informando divergência de credenciais exibida. | ✅ Automatizado |

---

## 🛡️ 3. Módulo de Segurança e Controle de Acesso (`admin_security.cy.js`)

| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Identificação&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; | Cenário | Pré-condição | Passos | Resultado Esperado | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **E2E-RBAC-01** | Admin visualiza links exclusivos na Navbar | Logado com credenciais de `ADMIN` | 1. Acessar a Home (`/`)<br>2. Validar visibilidade dos itens do menu lateral/superior | Links restritos ("Denúncias" e "Usuários") devem estar visíveis e acessíveis. | ✅ Automatizado |
| **E2E-RBAC-02** | Usuário comum não visualiza links de Admin | Logado com credenciais de `USER` | 1. Acessar a Home (`/`)<br>2. Validar visibilidade dos itens do menu | Links "Denunciar" e "Acompanhar" visíveis. Links restritos de `ADMIN` ocultos do DOM. | ✅ Automatizado |
| **E2E-RBAC-03** | Bloqueio de acesso forçado para rota administrativa | Logado com credenciais de `USER` | 1. Forçar requisição `GET` para `/admin/usuarios` via URL direta | Acesso negado pela aplicação. Tela de erro customizada ou indicativo de falta de permissão exibido. | ✅ Automatizado |
