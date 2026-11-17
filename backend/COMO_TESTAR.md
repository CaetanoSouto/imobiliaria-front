# Como testar a autenticação e autorização com JWT

## 1. Rodar o projeto

Para testar pelo navegador, abra http://localhost:8080/login.html (login, token e botões para testar as rotas).

No VS Code, abra a pasta e rode a classe `DemoApplication` (ou no terminal: `./mvnw spring-boot:run`, no Windows `mvnw.cmd spring-boot:run`).
Como as dependências novas foram adicionadas no `pom.xml`, na primeira vez o Maven vai baixá-las.

Ao subir, a aplicação já cria (classe `DadosIniciais`):

| E-mail | Senha | Tipo |
| --- | --- | --- |
| admin@email.com | 123 | ADMIN |
| user@email.com | 123 | USER |

E um imóvel de exemplo com id 1.

## 2. Fazer login (pegar o token)

`POST http://localhost:8080/auth/login` — Body JSON:

```json
{ "email": "admin@email.com", "senha": "123" }
```

Resposta 200 com o token:

```json
{ "token": "eyJhbGciOiJIUzI1NiIs...", "tipo": "ADMIN", "email": "admin@email.com" }
```

Faça o mesmo com `user@email.com` para ter o token do USER.
No Insomnia, coloque o token na aba **Auth → Bearer Token**.

## 3. Testes da tabela

| # | Requisição | Token | Esperado |
| --- | --- | --- | --- |
| 1 | `POST /auth/login` | nenhum | 200 + token |
| 2 | `GET /imoveis` e `GET /imoveis/1` | nenhum | 200 |
| 3 | `POST /imoveis` | nenhum | **401** |
| 4 | `POST /imoveis` | USER | **403** |
| 5 | `POST /imoveis` | ADMIN | 201 |
| 6 | `PUT /imoveis/1` / `DELETE /imoveis/1` | USER | **403** |
| 7 | `GET /users` | nenhum | **401** |
| 8 | `GET /users` | USER | **403** |
| 9 | `GET /users` | ADMIN | 200 |
| 10 | `POST /users/register` | ADMIN | 201 |
| 11 | `PATCH /imoveis/1/status` | nenhum | **401** |
| 12 | `PATCH /imoveis/1/status` | USER | **403** (o cliente só muda o status pelas ofertas e contratos) |
| 13 | qualquer rota protegida | token alterado/inválido | **401** |

Body do cadastro de imóvel (teste 5):

```json
{ "titulo": "Apartamento centro", "precoVenda": 250000, "finalidade": "VENDA", "status": "DISPONIVEL", "dormitorios": 2 }
```

Body do cadastro de usuário (teste 10):

```json
{ "nome": "Maria", "email": "maria@email.com", "senha": "123", "tipo": "USER" }
```

Body do alterar status (teste 12):

```json
{ "status": "VENDIDO" }
```

Respostas de erro:

```json
{ "status": 401, "erro": "Unauthorized", "mensagem": "Token não informado" }
{ "status": 403, "erro": "Forbidden", "mensagem": "Você não tem permissão para acessar este recurso" }
```

Para testar token expirado, mude `jwt.expiration` no `application.properties` para `10000` (10 segundos), faça login, espere e chame uma rota protegida: retorna 401 com "Token expirado".

## Dados para a vitrine do front-end

Ao subir, `DadosIniciais` também cria 4 bairros, 4 tipos de imóvel e 12 imóveis de exemplo (aluguel e venda; 10 `DISPONIVEL`, 1 `RESERVADO`, 1 `ALUGADO`) com fotos.
`GET /imoveis` agora devolve `fotos` (com `url` e `capa`), `bairro` e `tipoImovel`. `GET /bairros`, `GET /tipos-imoveis` e `GET /uploads/**` são públicos.
