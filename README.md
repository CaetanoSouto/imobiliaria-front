# Habitare Imóveis

Sistema da imobiliária (Trabalho Final). Este repositório tem as duas partes:

- **Front-end** (raiz do repositório): **React + Vite**.
- **Backend** (pasta [backend/](backend)): API REST em **Spring Boot** com MySQL.

O sistema tem uma vitrine pública de imóveis e três áreas privadas, uma para cada perfil: **cliente**, **corretor** e **administrador**.

## Tecnologias

- React 19 + Vite
- React Router (rotas, rotas protegidas por perfil e filtros na URL)
- Axios (chamadas à API, com interceptor que envia `Authorization: Bearer <token>` e trata o 401)
- CSS próprio (sem framework) e gráficos feitos em HTML/CSS, sem biblioteca extra
- oxlint para verificar o código

## Pré-requisitos

- Node.js 20 ou superior
- Java 17+ e Maven, para o backend (pasta [backend/](backend))
- MySQL em `localhost:3306` (usuário `root`, sem senha). O banco `imobiliaria` é criado sozinho.

## Como rodar

### 1. Backend

Com o MySQL ligado, a partir da raiz do repositório:

```bash
cd backend
mvn spring-boot:run
```

Se o seu usuário ou senha do MySQL forem outros, defina `DB_USER` e `DB_PASSWORD` antes de subir.

A chave que assina os tokens JWT vem da variável `JWT_SECRET`. Sem ela, o backend usa um valor de desenvolvimento que é **público** (está neste repositório): serve para estudar e rodar localmente, mas em qualquer uso real defina `JWT_SECRET` com uma chave longa e aleatória.

Ao subir, o backend cria usuários, bairros, tipos e imóveis de exemplo:

| E-mail | Senha | Perfil |
| --- | --- | --- |
| admin@email.com | 123 | ADMIN |
| corretor@email.com | 123 | CORRETOR |
| user@email.com | 123 | USER (cliente) |

> **Porta 8080 ocupada?** (o Tomcat do XAMPP, por exemplo) Suba o backend em outra porta e avise o front:
>
> ```bash
> cd backend
> mvn spring-boot:run "-Dspring-boot.run.arguments=--server.port=8090"
> ```
>
> e crie um arquivo `.env.local` na raiz do front com `API_PROXY_TARGET=http://localhost:8090`. Esse arquivo não vai para o git.

### 2. Front-end

Em outro terminal, na raiz do repositório:

```bash
npm install
cp .env.example .env    # ajuste VITE_IMOBILIARIA_EMAIL se quiser
npm run dev
```

Abra http://localhost:5173. Se o `npm run dev` já estava aberto, reinicie-o depois de mudar o `.env` ou o `.env.local`.

### Outros comandos

```bash
npm run build     # gera a versão de produção em dist/
npm run preview   # serve o build gerado
npm run lint      # verifica o código com o oxlint
```

## Variáveis de ambiente

| Variável | Para que serve | Padrão |
| --- | --- | --- |
| `VITE_API_URL` | URL base da API. Em desenvolvimento use `/api` (proxy do Vite). | `/api` |
| `VITE_IMOBILIARIA_EMAIL` | E-mail que recebe o contato "Entrar em contato" (link `mailto:`) do detalhe do imóvel. | `contato@imobiliaria.com` |
| `API_PROXY_TARGET` | Endereço do backend usado pelo proxy do Vite, só em desenvolvimento. | `http://localhost:8080` |

## Comunicação com a API

O backend não tem CORS configurado, então em desenvolvimento o Vite usa um **proxy**: toda chamada para `/api/...` é repassada para o backend, sem o prefixo `/api` (veja [vite.config.js](vite.config.js)). As fotos enviadas (`/uploads/...`) passam pelo mesmo caminho.

Toda requisição autenticada envia o token JWT. Quando a API responde:

| Resposta | O que o front faz |
| --- | --- |
| 401 (com token salvo) | Apaga o token e leva ao login com o aviso "sessão expirada". |
| 401 no login | Mostra "E-mail ou senha incorretos." |
| 403 | Mostra "Acesso negado". |
| 404 | Mostra que o item não foi encontrado. |
| 409 | Mostra a mensagem da regra de negócio que veio do backend. |
| Sem conexão | Pede para verificar se o backend está no ar. |

## Perfis e telas

### Público (sem login)

- **Vitrine** (`/`): cards com foto de capa, tipo, bairro, cidade, valor e finalidade; só imóveis disponíveis.
- **Detalhe** (`/imoveis/:id`): galeria de fotos e todas as informações; "Imóvel não encontrado" em caso de 404.
- **Entrar em contato**: abre o e-mail com assunto e corpo já preenchidos (código, tipo, bairro e valor).
- **Filtros** combinados (bairro, finalidade e faixa de preço validada) com botão **Limpar filtros**.
- **Ordenação** por preço, crescente e decrescente.
- **Paginação** de 9 em 9. Filtros, ordem e página ficam na URL (`?bairro=1&finalidade=VENDA&ordem=preco-asc&pagina=2`).
- **Login** com validação de campos e e-mail; cada perfil vai para a sua área inicial.

### Cliente (`/cliente`)

- Resumo com indicadores e gráfico das suas ofertas.
- **Fazer oferta** no detalhe do imóvel (aluguel ou venda). O botão só aparece em imóveis disponíveis.
- **Minhas ofertas** com a situação de cada uma; dá para cancelar as pendentes ou em espera.
- **Favoritos**: listar, adicionar e remover.
- **Contratos**: lista com a situação, baixa o PDF e assina quando liberado.

### Corretor (`/corretor`)

- Painel com indicadores e gráficos.
- **Ofertas recebidas**: filtra por situação, aceita (e prepara o contrato, com as condições) ou recusa.
- **Contratos**: acompanha a aprovação e a assinatura, e baixa o PDF.

### Administrador (`/admin`)

- Painel com os totais (imóveis disponíveis, ofertas pendentes, contratos para aprovar e aguardando assinatura) e gráficos de **imóveis por bairro**, **imóveis por finalidade**, **imóveis por situação**, **ofertas por situação**, **ofertas por mês** e **contratos por situação**.
- **Ofertas**: lista todas, filtra por situação, aceita ou recusa.
- **Contratos**: lista, baixa o PDF, aprova ou reprova/cancela. O cliente é avisado por e-mail.
- **Imóveis**, **Bairros**, **Tipos de imóveis** e **Fotos**: cadastrar, listar, editar e excluir, sempre pedindo confirmação antes de excluir.
- **Usuários**: cadastrar, buscar por nome ou e-mail, editar, trocar o perfil e excluir. Um admin não exclui a si mesmo.

O menu mostra só as opções do perfil logado, e digitar a URL de uma tela protegida sem permissão leva ao login ou a "Acesso negado".

## Fluxo de um contrato

```
Cliente envia a oferta
        │
        ▼
Corretor (ou admin) aceita ──► o imóvel fica RESERVADO e as outras ofertas pendentes ficam EM ESPERA
        │                      o contrato é preparado: AGUARDANDO APROVAÇÃO
        ▼
Admin aprova ──► o PDF é gerado e o cliente é avisado por e-mail: AGUARDANDO ASSINATURA
        │
        ▼
Cliente assina ──► ASSINADO: o imóvel vira ALUGADO ou VENDIDO e as outras ofertas são RECUSADAS
```

Se o cliente desistir, o admin cancela o contrato: o imóvel volta a ficar disponível e as ofertas em espera voltam a ser pendentes.

## Regras de negócio

- Só imóveis disponíveis recebem ofertas; reservados, alugados e vendidos não mostram o botão "Fazer oferta".
- Um cliente não pode ter duas ofertas pendentes para o mesmo imóvel.
- Vários clientes podem ofertar ao mesmo imóvel ao mesmo tempo.
- O cliente só assina depois que o admin aprova o contrato.
- Imóvel que já recebeu ofertas não pode ser excluído; usuário com ofertas também não.

## E-mail do contrato

Ao aprovar ou cancelar um contrato, o **backend** envia um e-mail ao cliente (com o PDF em anexo, no caso da aprovação). Isso só funciona com SMTP configurado no backend, pelas variáveis `MAIL_USER`, `MAIL_PASSWORD`, `MAIL_HOST`, `MAIL_PORT` e `MAIL_FROM`. Sem `MAIL_USER`, nada é enviado: a aprovação continua valendo e a tela avisa que o e-mail **não** saiu.

## Estrutura

```
backend/        API Spring Boot (pom.xml, src/main/java, testes, coleção do Postman)
src/            Front-end:
```

O front-end:

```
src/
  components/   Header, ProtectedRoute, ImovelCard, Filtros, Paginacao, Galeria, Feedback,
                ConfirmarExclusao, Graficos (indicadores, barras, colunas), PainelGestao
  context/      AuthContext (sessão, login, logout, expiração do token)
  hooks/        useCarregar (carregando/erro), useVitrine (filtros/ordem/página na URL)
  pages/        Vitrine, DetalheImovel, Login, AcessoNegado, NaoEncontrada,
                AreaCliente, AreaCorretor, AreaAdmin, GestaoOfertas, GestaoContratos
    cliente/    MinhasOfertas, Favoritos, MeusContratos
    admin/      Imoveis, Fotos, Bairros, Tipos, Usuarios
  services/     api.js (axios + token + 401) e um serviço por assunto
                (auth, imóveis, bairros, tipos, fotos, usuários, cliente, gestão)
  utils/        imoveis, painel (dados dos gráficos), contato (mailto), download (PDF),
                validacao, jwt, erros, formatar, perfil, marca
```

## Testes

As regras de negócio são testadas no **backend** (`cd backend` e `mvn test`): fluxo da oferta ao contrato, gestão de usuários e de imóveis, PDF e e-mail. No front, `npm run lint` e `npm run build` verificam o código.

## Andamento

- [x] **Semana 1**: projeto criado e primeira chamada à API (`GET /imoveis`)
- [x] **Semana 2**: área pública completa e login com rotas protegidas
- [x] **Semana 3**: perfis, ofertas, favoritos, contratos (envio, aprovação e assinatura) e painéis com gráficos
- [x] **Semana 4**: área do admin (CRUDs, gestão de usuários, ofertas e contratos)
