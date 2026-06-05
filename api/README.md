# Beauty Express API

API REST para gestão de salão de beleza, desenvolvida com **NestJS 11** e **PostgreSQL**.

## Arquitetura

```
src/
├── application/
│   ├── controllers/     # Endpoints HTTP
│   └── dtos/            # Validação (class-validator)
├── domain/
│   ├── entities/        # TypeORM
│   ├── repositories/    # Acesso a dados
│   ├── services/        # Regras de negócio
│   └── modules/         # Módulos NestJS
├── config/
│   └── database.config.ts
└── scripts/
    └── seed.ts
```

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
```

| Variável | Descrição |
|----------|-----------|
| `CORS_ORIGIN` | URL(s) do frontend, separadas por vírgula |
| `DB_SYNCHRONIZE` | `true` em dev; `false` em produção |
| `DB_SSL` | `true` para Postgres gerenciado (Railway, Render, etc.) |

## Executando

```bash
# Desenvolvimento (watch)
npm run start:dev

# Produção
npm run build
npm run start:prod

# Dados de exemplo
npm run seed
```

- API: `http://localhost:3000`
- Swagger: `http://localhost:3000/docs`

## Testes

```bash
npm test
npm run test:cov
```

164 testes cobrindo services e controllers.

## Endpoints

### Colaboradores
- `POST /collaborators` — criar
- `GET /collaborators` — listar (busca opcional)
- `GET /collaborators/:id` — buscar
- `PUT /collaborators/:id` — atualizar
- `DELETE /collaborators/:id` — remover

### Serviços
- `POST /services`
- `GET /services`
- `GET /services/:id`
- `PUT /services/:id`
- `DELETE /services/:id`

### Agendamentos
- `POST /appointments` — criar (retroativos concluem automaticamente)
- `GET /appointments?date=YYYY-MM-DD` — listar por data
- `GET /appointments/:id`
- `PUT /appointments/:id`
- `PUT /appointments/:id/complete`
- `PUT /appointments/:id/cancel`

### Serviços agendados
- `POST /scheduled-services/appointment/:appointmentId`
- `PUT /scheduled-services/:id`
- `PUT /scheduled-services/:id/cancel`

### Comissões
- `GET /commissions` — filtros: `paid`, `startDate`, `endDate`, `collaboratorId`
- `PUT /commissions/mark-as-paid`
- `PUT /commissions/mark-as-unpaid`

### Relatórios
- `GET /financial-reports/monthly?year=2026&month=6`

## Docker

Build da imagem (apenas API):

```bash
docker build -t beauty-express-api .
```

## Deploy

Consulte **[../docs/DEPLOY.md](../docs/DEPLOY.md)**.
