# Ageendoo API

API REST de gestão para salões/esmalterias/barbearias, desenvolvida com **NestJS 11** e **PostgreSQL 16**.

> O repositório/pacote ainda se chama `beauty-express` (nome técnico). O produto é o **Ageendoo**.

## Arquitetura

```
src/
├── application/
│   ├── controllers/     # Endpoints HTTP
│   └── dtos/            # Validação (class-validator)
├── domain/
│   ├── entities/        # TypeORM
│   ├── repositories/    # Acesso a dados (sempre por tenantId)
│   ├── services/        # Regras de negócio (REQUEST scope onde usa tenant)
│   └── modules/         # Módulos NestJS
├── config/
│   ├── database.config.ts
│   ├── data-source.ts   # CLI TypeORM (migrations)
│   └── jwt.config.ts
├── migrations/
└── scripts/
    ├── seed.ts          # seed completo (reset + dados demo)
    └── seed-tenant.ts   # seed leve escopado por um tenant
```

Multi-tenant por banco único + coluna `tenantId`. Perfis: `super_admin`, `admin`, `collaborator`.

## Pré-requisitos

- Node.js 20+
- PostgreSQL 16 (ou Docker)

## Instalação

```bash
npm install
cp .env.example .env
```

### PostgreSQL com Docker

```bash
npm run db:up      # sobe o container (docker-compose.yml nesta pasta)
npm run db:down    # para o container
```

## Configuração (`.env`)

```env
PORT=3000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173

DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=beauty_express
DB_SYNCHRONIZE=true
DB_LOGGING=false

JWT_ACCESS_SECRET=change-me-access-secret
JWT_REFRESH_SECRET=change-me-refresh-secret
```

| Variável | Descrição |
|----------|-----------|
| `CORS_ORIGIN` | URL(s) do frontend, separadas por vírgula |
| `DB_SYNCHRONIZE` | `true` em dev; `false` em produção (use migrations) |
| `DB_SSL` | `true` para Postgres gerenciado (Railway, Render, etc.) |

> Em dev, `DB_SYNCHRONIZE=true` cria/atualiza o schema automaticamente. **Atenção:** isso mascara a falta de migrations — toda entidade nova precisa de migration própria antes de ir para produção.

## Executando

```bash
# Desenvolvimento (watch)
npm run start:dev

# Produção
npm run build
npm run start:prod

# Dados de exemplo (reset + seed completo)
npm run db:reset && npm run seed
```

- API: `http://localhost:3000`
- Swagger operacional: `http://localhost:3000/docs`
- Swagger backoffice: `http://localhost:3000/docs/admin`

## Testes

```bash
npm test
npm run test:cov
```

~293 testes cobrindo services e controllers.

## Endpoints principais

### Auth
- `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`, `GET /auth/me`
- `POST /auth/admin/login` (backoffice / super admin)

### Colaboradores
- `GET/POST /collaborators`, `GET/PUT/DELETE /collaborators/:id`
- Endpoints de acesso do colaborador (conceder/remover login próprio)

### Serviços
- `GET/POST /services`, `GET/PUT/DELETE /services/:id`
- A comissão (`commissionPercentage`) fica **no serviço**

### Agendamentos
- `POST /appointments` (retroativos concluem automaticamente)
- `GET /appointments?date=YYYY-MM-DD`
- `GET /appointments/:id`, `PUT /appointments/:id`
- `PUT /appointments/:id/complete`, `/cancel`, `/reopen`

### Serviços agendados
- `POST /scheduled-services/appointment/:appointmentId`
- `PUT /scheduled-services/:id`, `PUT /scheduled-services/:id/cancel`

### Comissões
- `GET /commissions` — filtros: `paid`, `startDate`, `endDate`, `collaboratorId`
- `PUT /commissions/mark-as-paid`, `/mark-as-unpaid`
- `GET /commissions/alerts` — alertas de comissão atrasada

### Despesas
- `GET/POST /expenses`, `PUT/DELETE /expenses/:id`
- Tipos `one_time` (esporádica) e `recurring` (fixa) + categorias

### Relatórios
- `GET /financial-reports/monthly?year=2026&month=6`
- `GET /financial-reports/period`, `/timeseries`, `/top-services`
- Incluem receita, comissões, **despesas e lucro líquido**

### Configurações e admin
- `GET/PATCH /settings` — branding, regime de período, respostas rápidas
- `GET/POST /admin/tenants`, `/admin/users`, `GET /admin/audit-logs`

## Clientes

Entidade `Client` (por tenant) com `phone`/`phoneNormalized`, vinculada a agendamentos.

## Migrations

```bash
npm run migration:run            # dev
npm run migration:run:prod       # pós-build (produção)
npm run migration:generate -- src/migrations/NomeDaMigration
```

Em produção (`NODE_ENV=production`) as migrations rodam automaticamente no boot (`migrationsRun: true`).

## WhatsApp / Atendimento — 🚧 em desenvolvimento

Disponível **apenas na branch `feat/whatsapp`** (ainda não em produção). Inbox de atendimento via **Evolution API** (não oficial): instâncias/conversas/mensagens, pareamento por QR, status de entrega, reações, mídia, tempo real por WebSocket (`/whatsapp`), respostas rápidas e catálogo configuráveis. Dev: `npm run evolution:up` (sobe Evolution + Postgres + Redis via `docker-compose.evolution.yml`). Envs: `EVOLUTION_API_URL`, `EVOLUTION_API_KEY`, `EVOLUTION_WEBHOOK_PUBLIC_URL`, `EVOLUTION_WEBHOOK_TOKEN`.

## Docker

```bash
docker build -t beauty-express-api .
```

## Deploy

Consulte **[../docs/DEPLOY.md](../docs/DEPLOY.md)**.
