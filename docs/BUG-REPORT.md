## 🐞 Relatório de Defeitos 

Esta seção documenta os defeitos encontrados durante o ciclo de desenvolvimento e testes, bem como suas respectivas análises de causa raiz e resoluções.

---

### 🔴 BUG-001: Bypass de Autorização na Listagem de Usuários (RBAC)

**Status:** `Resolvido ✅` | **Severidade:** `Crítica` | **Data:** 07/04/2026

**Impacto de Negócio/Segurança:** Alto risco de vazamento de dados sensíveis de usuários (PII). Um usuário comum poderia expor a base inteira, violando as normas da LGPD.

#### 1. Resumo do Defeito
Usuários autenticados com o perfil comum (`ROLE_USER`) conseguem acessar a rota protegida `GET /users`, que deveria ser restrita exclusivamente a administradores (`ROLE_ADMIN`).

#### 2. Passos para Reproduzir
1. Iniciar a API em ambiente local.
2. Realizar o cadastro de um usuário comum via `POST /users` (O sistema atribui `ROLE_USER` por padrão).
3. Realizar login em `POST /login` com as credenciais cadastradas e capturar o Token JWT.
4. Enviar uma requisição `GET` para o endpoint `/users` incluindo o cabeçalho: `Authorization: Bearer <TOKEN>`.

#### 3. Resultados
* **Resultado Esperado:** A API deve interceptar a requisição via `AccessDeniedHandler` e retornar o status `403 Forbidden` com a mensagem *"Acesso negado. Você não tem permissão de administrador..."*.
* **Resultado Obtido:** A API retornou status `200 OK` acompanhado da lista completa de usuários cadastrados no banco de dados.

#### 4. Análise de Causa Raiz (Root Cause Analysis)
O problema ocorreu na cadeia de filtros do Spring Security (`SecurityConfigurations.java`). O método `authorizeHttpRequests` avalia as regras sequencialmente (de cima para baixo). A regra genérica `.anyRequest().authenticated()` foi declarada **antes** da regra específica restritiva `.requestMatchers(HttpMethod.GET, "/users").hasRole("ADMIN")`. 
Desta forma, o Spring validava que o usuário possuía um token válido (autenticado) e liberava o acesso imediatamente, ignorando a checagem de *Role* (autorização) que estava na linha abaixo.

#### 5. Resolução (Fix)
A ordem das regras de autorização foi invertida, garantindo que as rotas mais específicas e restritivas sejam avaliadas antes da regra de "captura geral" (catch-all).

**Trecho Corrigido:**
```java
.authorizeHttpRequests(req -> {
    req.requestMatchers(HttpMethod.POST, "/login").permitAll();
    req.requestMatchers(HttpMethod.POST, "/users").permitAll();
    
    // Regra específica avaliada primeiro
    req.requestMatchers(HttpMethod.GET, "/users").hasRole("ADMIN"); 
    
    // Regra genérica avaliada por último
    req.anyRequest().authenticated();
})
```

---

### 🔴 BUG-002: LazyInitializationException em Testes de Integração

**Status:** Resolvido ✅ | **Severidade:** Média | **Data:** 08/04/2026

#### 1. Resumo do Defeito
Durante a execução dos testes de integração, ocorre uma falha de sessão do banco de dados ao tentar validar o e-mail do autor de uma denúncia recém-criada, gerando a exceção `LazyInitializationException`.

#### 2. Passos para Reproduzir
1. Iniciar a suíte de testes E2E/Integração com Spring Boot.
2. Criar um usuário válido e gerar um Token JWT.
3. Criar uma denúncia via requisição `POST /reports` enviando o Token no cabeçalho.
4. Buscar a denúncia recém-criada no banco via `repository.findByProtocolo(...)`.
5. Tentar acessar uma propriedade do autor através do método getter (ex: `denuncia.getAuthor().getEmail()`).

#### 3. Resultados
* **Resultado Esperado:** O teste deve acessar a propriedade do autor com sucesso e validar a asserção `assertEquals()`.
* **Resultado Obtido:** O teste quebra retornando a exceção: `org.hibernate.LazyInitializationException: could not initialize proxy - no Session`.

#### 4. Análise de Causa Raiz (Root Cause Analysis)
O mapeamento JPA da entidade `Report` define o relacionamento com a entidade `User` (`author`) utilizando `FetchType.LAZY`. Isso faz com que o Hibernate atrase a busca do usuário no banco até o momento em que ele for explicitamente chamado. Como a consulta inicial (`findByProtocolo`) já havia sido concluída, a sessão do banco de dados foi encerrada. Quando o método `getAuthor().getEmail()` foi chamado logo em seguida, não havia mais uma sessão aberta para buscar esse dado no banco.

#### 5. Resolução (Fix)
Foi criada uma nova consulta customizada no repositório utilizando a instrução `JOIN FETCH`. Isso obriga o Hibernate a carregar os dados do relacionamento `author` na mesma consulta (de forma ávida), evitando a necessidade de reabrir a sessão.

**Trecho Corrigido (`ReportRepository.java`):**
```java
@Query("SELECT r FROM Report r JOIN FETCH r.author WHERE r.protocolo = :protocolo")
Optional<Report> findByProtocoloComAutor(String protocolo);
````
---

### 🔴 BUG-003: Falha de Segurança e Mascaramento de Erro na Criação de Denúncia Anônima

**Status:** Resolvido ✅ | **Severidade:** Crítica | **Data:** 09/04/2026

**Impacto de Negócio**: Permite injeção de dados inválidos no banco de dados e expõe vulnerabilidades na camada de persistência.

#### 1. Resumo do Defeito
A API permite que requisições não autenticadas (sem Token JWT) acessem o endpoint protegido de criação de denúncias (`POST /reports`). A requisição acaba falhando no banco de dados por falta do autor, mas o erro de banco de dados é capturado indevidamente pelo tratador global de exceções, que mascara a falha retornando um código `409 Conflict` com a mensagem falsa "E-mail já cadastrado no sistema", em vez do correto `403 Forbidden`.

#### 2. Passos para Reproduzir
1. Iniciar a API em ambiente local ou executar a suíte de testes de integração.
2. Preparar um payload JSON válido para a criação de uma denúncia (Título, Categoria e Descrição).
3. Enviar uma requisição HTTP `POST /reports` contendo o payload.
4. **Omitir intencionalmente** o cabeçalho de autenticação (`Authorization: Bearer <TOKEN>`).

#### 3. Resultados
* **Resultado Esperado:** O Spring Security deve interceptar a requisição anônima e retornar o status `403 Forbidden` (ou `401 Unauthorized`), bloqueando o acesso à camada de controle (`Controller`).
* **Resultado Obtido:** A requisição ignora a barreira de segurança, atinge o banco de dados e retorna o status HTTP `409 Conflict` com um JSON contendo a mensagem: `{"mensagem": "E-mail já cadastrado no sistema."}`.

#### 4. Análise de Causa Raiz (Root Cause Analysis)
O incidente ocorreu devido a uma combinação de duas falhas de configuração distintas:
1. **Falha de Autorização (Security Bypass):** O arquivo `SecurityConfigurations.java` possuía uma regra legada de `.permitAll()` para o endpoint `/reports`. O Spring Security avaliou a regra e permitiu a passagem. Como não havia Token, a anotação `@AuthenticationPrincipal` injetou um objeto `User` com valor `null` no Controller.
2. **Mascaramento de Exceção (Exception Hiding):** A entidade `Report` exige a presença de um autor (`user_id` não nulo). Quando a aplicação tentou salvar a denúncia, o banco de dados (H2/Postgres) lançou uma exceção de integridade (`SqlExceptionHelper: NULL not allowed for column "USER_ID"`). No entanto, a classe `GlobalExceptionHandler` possuía um tratador genérico para `DataIntegrityViolationException` que fixava estaticamente a mensagem de retorno como erro de e-mail duplicado, independentemente da coluna que causou a violação.

#### 5. Resolução (Fix)
A vulnerabilidade principal foi corrigida ajustando a cadeia de filtros de segurança para bloquear a rota na porta de entrada.

**Trecho Corrigido (`SecurityConfigurations.java`):**
```java
// A regra permissiva (.permitAll) foi removida e substituída pela regra restritiva
.authorizeHttpRequests(req -> {
    // ... outras regras ...
    req.requestMatchers(HttpMethod.POST, "/reports").hasRole("USER"); // Correção
    req.anyRequest().authenticated();
})
```

### 🔴 BUG-004: Mascaramento de Erro de Conversão (400) por Bloqueio do Dispatcher (403)

**Status:** Resolvido ✅ | **Severidade:** Média | **Data:** 09/04/2026

#### 1. Resumo do Defeito
Ao enviar um payload contendo um valor inválido para um campo do tipo `Enum` (ex: categoria "FESTA"), a API deveria retornar um erro de validação (`400 Bad Request`). No entanto, a aplicação está mascarando o erro e retornando um problema de autorização (`403 Forbidden`), mesmo quando a requisição possui um Token JWT perfeitamente válido.

#### 2. Passos para Reproduzir
1. Autenticar no sistema e capturar um Token JWT válido.
2. Montar um payload JSON para criação de denúncia (`POST /reports`).
3. Preencher o campo `categoria` com uma String não mapeada no Enum `ReportCategory` (ex: `"FESTA"`).
4. Enviar a requisição incluindo o cabeçalho `Authorization`.

#### 3. Resultados
* **Resultado Esperado:** A API deve identificar a falha na conversão do JSON para Enum e retornar status `400 Bad Request` com uma mensagem de erro de formatação.
* **Resultado Obtido:** A API recusa a requisição com status `403 Forbidden`, induzindo o desenvolvedor/usuário a achar que o problema está no Token ou na sua permissão de acesso.

#### 4. Análise de Causa Raiz (Root Cause Analysis)
O problema reside no ciclo de vida de exceções não tratadas do Spring Boot 3 em conjunto com o Spring Security 6.
1. O conversor Jackson falha ao transformar a String `"FESTA"` em Enum, lançando uma `HttpMessageNotReadableException`.
2. Como essa exceção não estava mapeada no `TratadorDeErros`, ela subiu até o contêiner web (Tomcat).
3. O Tomcat tenta redirecionar internamente a requisição para a rota padrão `/error` para montar a resposta de falha.
4. O Spring Security 6, por padrão, bloqueia redirecionamentos internos do tipo `DispatcherType.ERROR` se eles não estiverem explicitamente liberados. O bloqueio na rota `/error` gera o código HTTP 403, mascarando o erro original 400.

#### 5. Resolução (Fix)
Foi adicionado um tratador específico no `TratadorDeErros` (`@RestControllerAdvice`) para interceptar a `HttpMessageNotReadableException` antes que ela "vaze" para o contêiner web. 

**Trecho Corrigido (`TratadorDeErros.java`):**
```java
@ExceptionHandler(HttpMessageNotReadableException.class)
public ResponseEntity tratarErroDeConversao(HttpMessageNotReadableException ex) {
    // Intercepta a falha e devolve o status HTTP e JSON corretos diretamente
    return ResponseEntity.badRequest()
            .body(new DadosErroSimples("Formato de dado inválido. Verifique se as opções enviadas estão corretas."));
}
```

### 🔴 BUG-005: Falha de Automação E2E por Conflito de Gestão de Sessão (Redirecionamento)

**Status:** `Resolvido ✅` | **Severidade:** `Baixa (Testes)` | **Data:** 09/04/2026
**Impacto Técnico:** Falsos positivos (*Flaky Tests*) na esteira de automação CI/CD, impedindo a validação contínua da aplicação.

#### 1. Resumo do Defeito
O cenário de teste de acompanhamento de denúncia (`E2E-REP-04`) do Cypress falhava com o erro genérico `Element Not Found (#protocolo)`, impedindo a conclusão da suíte.

#### 2. Passos para Reproduzir
1. Executar a suíte `follow_up.cy.js` no *runner* do Cypress.
2. Observar a execução do teste de tentativa de acesso com código inválido.

#### 3. Resultados
* **Resultado Esperado:** O Cypress deve preencher os campos, clicar no botão e validar a mensagem de erro.
* **Resultado Obtido:** O Cypress sofre um *timeout* e falha, indicando que não encontrou o campo de input na tela.

#### 4. Análise de Causa Raiz (RCA)
O teste tentava visitar a rota protegida `/acompanhar` diretamente. Como não havia um Cookie de Sessão válido gerado antes deste teste específico (o login estava restrito ao bloco de teste anterior), o servidor Javalin interceptou a requisição anônima e executou um `302 Redirect` para a tela de `/login`. Como a tela de login possui um DOM diferente (sem os campos de `#protocolo`), o Cypress não encontrou os elementos alvo, quebrando a execução.

#### 5. Resolução (Fix)
Isolamento do *setup* de autenticação. A chamada do comando customizado `cy.login()` foi movida para um *hook* `beforeEach()`, garantindo que o contexto de sessão do navegador seja restabelecido corretamente antes da execução de cada cenário de teste na suíte.

---

### 🔴 BUG-006: TypeError no Contador de Caracteres (Null Reference)

**Status:** `Resolvido ✅` | **Severidade:** `Média` | **Data:** 09/04/2026
**Impacto de Negócio:** Interrupção de scripts de front-end, impedindo funcionalidades secundárias (botões de copiar) e causando falhas de carregamento nos testes E2E do Cypress.

#### 1. Resumo do Defeito
O script `atualizarContador()`, responsável por exibir a quantidade de caracteres digitados na denúncia, causa uma exceção não tratada ao tentar acessar um elemento que não existe no DOM da página de sucesso ou de login.

#### 2. Passos para Reproduzir
1. Iniciar a aplicação Echo.
2. Realizar o fluxo de envio de uma denúncia com sucesso.
3. Ao carregar a tela de confirmação (onde o formulário é removido), abrir o Console do Desenvolvedor (F12).
4. Observar o erro: `Uncaught TypeError: Cannot read properties of null (reading 'value')`.

#### 3. Resultados
* **Resultado Esperado:** O script deve verificar a existência dos elementos antes de tentar manipular suas propriedades.
* **Resultado Obtido:** O script tenta acessar `.value` de um objeto `null`, travando a execução de outros scripts na página.

#### 4. Análise de Causa Raiz (RCA)
A função `atualizarContador` estava vinculada ao evento `window.onload` de forma global. No entanto, ela não possuía uma Cláusula de Guarda (*Guard Clause*). Quando o Thymeleaf renderizava a tela de sucesso, o campo `id="descricao"` era removido do DOM, mas o script continuava tentando acessá-lo. Como o JavaScript é *single-threaded*, esse erro interrompia o ciclo de execução do navegador.

#### 5. Resolução (Fix)
Foi implementada uma verificação de nulidade no início da função para garantir que ela encerre sua execução silenciosamente se os elementos não forem encontrados.

**Trecho Corrigido (`layout.html / denuncia.html`):**

```javascript
function atualizarContador() {
    const textarea = document.getElementById("descricao");
    const contador = document.getElementById("contador");

    // Implementação da Cláusula de Guarda
    if (!textarea || !contador) return;

    contador.innerText = textarea.value.length;
}
