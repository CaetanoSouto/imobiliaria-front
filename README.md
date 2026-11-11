# Habitare Imóveis — Front-end

Front-end do sistema da imobiliária (Trabalho Final), feito com **React + Vite**, consumindo a API REST em Spring Boot desenvolvida na disciplina.

## Tecnologias

- React 19 + Vite
- React Router (rotas, rotas protegidas e filtros na URL)
- Axios (chamadas à API, com interceptor que envia `Authorization: Bearer <token>`)

## Pré-requisitos

- Node.js 20 ou superior
- Backend da disciplina rodando em `http://localhost:8080` (Java 17+; usa banco H2 em memória)

## Como rodar

### 1. Backend

No projeto do backend:

```bash
./mvnw spring-boot:run
```

Ao subir, ele cria usuários e imóveis de exemplo:

| E-mail | Senha | Perfil |
| --- | --- | --- |
| admin@email.com | 123 | ADMIN |
| user@email.com | 123 | USER (cliente) |

### 2. Front-end

```bash
npm install
cp .env.example .env    # ajuste VITE_IMOBILIARIA_EMAIL se quiser
npm run dev
```

Abra http://localhost:5173.

## Variáveis de ambiente

| Variável | Para que serve | Padrão |
| --- | --- | --- |
| `VITE_API_URL` | URL base da API. Em desenvolvimento use `/api` (proxy do Vite). | `/api` |
| `VITE_IMOBILIARIA_EMAIL` | E-mail que recebe o contato "Entrar em contato" (link `mailto:`) do detalhe do imóvel. | `contato@imobiliaria.com` |

## Comunicação com a API

O backend não tem CORS configurado, então em desenvolvimento o Vite usa um **proxy**: toda chamada para `/api/...` é repassada para `http://localhost:8080/...` (veja [vite.config.js](vite.config.js)). As fotos enviadas (`/uploads/...`) passam pelo mesmo caminho.

## Estrutura

```
src/
  components/   Header, ProtectedRoute, ImovelCard, Filtros, Paginacao, Galeria, Feedback
  context/      AuthContext (sessão, login, logout, expiração do token)
  hooks/        useCarregar (carregando/erro), useVitrine (filtros/ordem/página na URL)
  pages/        Vitrine, DetalheImovel, Login, AcessoNegado, AreaCliente, AreaAdmin, NaoEncontrada
  services/     api.js (axios + token + 401), authService.js, imoveisService.js
  utils/        imoveis.js (filtrar, ordenar, paginar), contato.js (mailto), jwt.js, erros.js, formatar.js
```

## Funcionalidades (Semana 2)

- **Vitrine** (`/`): cards com foto de capa, tipo, bairro, cidade, valor e finalidade; só imóveis `DISPONIVEL`.
- **Detalhe** (`/imoveis/:id`): galeria de fotos e todas as informações; "Imóvel não encontrado" em caso de 404.
- **Entrar em contato**: abre o e-mail com assunto e corpo preenchidos (código, tipo, bairro e valor).
- **Filtros** combinados (bairro, finalidade, faixa de preço validada) e botão **Limpar filtros**.
- **Ordenação** por preço crescente/decrescente (usa o valor de venda ou de aluguel conforme a finalidade).
- **Paginação** de 9 em 9, com anterior, próxima e números; mudar filtro/ordem volta à página 1.
- Filtros, ordenação e página ficam na **URL** (`?bairro=1&finalidade=VENDA&min=100000&ordem=preco-asc&pagina=2`).
- **Login** com JWT: validação de campos e e-mail, mensagens para credencial inválida e erro de servidor/sem conexão; admin vai para `/admin`, cliente para `/cliente`.
- **Rotas protegidas por perfil**: sem token vai para `/login`; perfil errado vai para "Acesso negado"; 401 apaga o token e volta ao login com aviso de sessão expirada.
- **Menu** muda conforme o perfil; **Sair** apaga o token.

## Andamento

- [x] **Semana 1** — projeto criado, primeira chamada à API (`GET /imoveis`)
- [x] **Semana 2** — área pública completa (vitrine, detalhe, contato, filtros, ordenação, paginação) e login/rotas protegidas
- [ ] Semana 3 — área do cliente (ofertas, favoritos, contratos)
- [ ] Semana 4 — área do admin (CRUDs, gestão, painel com gráficos)
