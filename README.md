# Imobiliária Iffar — Front-end

Front-end do sistema da imobiliária (Trabalho Final), feito com **React + Vite**, consumindo a API REST em Spring Boot desenvolvida na disciplina.

## Tecnologias

- React 19 + Vite
- React Router (rotas)
- Axios (chamadas à API, com interceptor que envia `Authorization: Bearer <token>`)

## Pré-requisitos

- Node.js 20 ou superior
- Backend da disciplina rodando em `http://localhost:8080` (Java 17 + MySQL)

## Como rodar

### 1. Backend

No projeto do backend:

```bash
./mvnw spring-boot:run
```

Ele precisa de um MySQL em `localhost:3306` (veja `application.properties`). Um admin é criado automaticamente na primeira execução: `admin@imobiliaria.com` / `admin123`.

### 2. Front-end

```bash
npm install
cp .env.example .env    # opcional; o padrão já é /api
npm run dev
```

Abra http://localhost:5173.

## Comunicação com a API

O backend não tem CORS configurado, então em desenvolvimento o Vite usa um **proxy**: toda chamada para `/api/...` é repassada para `http://localhost:8080/...` (veja [vite.config.js](vite.config.js)). A URL base pode ser trocada pela variável `VITE_API_URL`.

## Estrutura

```
src/
  components/   Header, ImovelCard, Feedback (carregando / sem resultados / erro)
  pages/        Vitrine, NaoEncontrada
  services/     api.js (axios + token + 401), imoveisService.js
  utils/        erros.js (mensagens amigáveis por status HTTP), formatar.js
```

## Andamento

- [x] **Semana 1** — projeto criado, primeira chamada à API (`GET /imoveis`) na vitrine, com estados de carregando, vazio e erro
- [ ] Semana 2 — login JWT, detalhe do imóvel, filtros, ordenação e paginação
- [ ] Semana 3 — área do cliente (ofertas, favoritos, contratos)
- [ ] Semana 4 — área do admin (CRUDs, gestão, painel com gráficos)
