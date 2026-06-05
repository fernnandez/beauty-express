# 💅 Beauty Express

Sistema completo de gestão para salões de beleza, com agendamentos, colaboradores, serviços, comissões automáticas e relatórios financeiros.

## 📋 Sobre o Projeto

- **Gestão de Colaboradores** — cadastro, comissão personalizada, ativação/desativação
- **Catálogo de Serviços** — preços, descrição e associação com colaboradores
- **Agendamentos** — múltiplos serviços, horários, status e registro retroativo
- **Comissões** — cálculo automático ao concluir serviços, controle de pagamento
- **Relatórios Financeiros** — visão mensal de receita, comissões e valor líquido

## 📸 Screenshots

| Dashboard | Agendamentos | Novo Agendamento |
|-----------|--------------|------------------|
| ![Dashboard](.github/prints/1.png) | ![Agendamento](.github/prints/2.png) | ![Criando um Agendamento](.github/prints/3.png) |

## 🏗️ Arquitetura

Monorepo com **API REST** e **frontend SPA** independentes:

```
beauty-express/
├── api/                  # NestJS 11 + TypeORM + PostgreSQL
├── frontend/             # React 19 + Vite + Mantine
├── api/docker-compose.yml  # PostgreSQL local
└── docs/
    ├── DEPLOY.md         # Guia de implantação
    └── MULTI_TENANT.md   # Roadmap multi-tenant
```

```
┌──────────────┐     HTTP (CORS)      ┌──────────────┐
│   Frontend   │ ──────────────────►  │     API      │
│  :5173 dev   │                      │   :3000      │
│  Vite/React  │                      │   NestJS     │
└──────────────┘                      └──────┬───────┘
                                           │
                                    ┌──────▼───────┐
                                    │  PostgreSQL  │
                                    │    :5432     │
                                    └──────────────┘
```

### Backend (`api/src`)

```
application/    # Controllers, DTOs
domain/         # Entities, Repositories, Services, Modules
config/         # database.config.ts
scripts/        # seed.ts
```

### Frontend (`frontend/src`)

```
components/     # UI por domínio (appointment, collaborator, service)
pages/          # Dashboard, Colaboradores, Serviços, Agendamentos, etc.
hooks/          # React Query
services/       # Cliente HTTP (Axios)
```

## 🚀 Tecnologias

| Camada | Stack |
|--------|-------|
| **API** | NestJS 11, TypeORM, PostgreSQL, Swagger, Jest |
| **Frontend** | React 19, Vite 7, Mantine 8, TanStack Query, Luxon, dayjs |
| **Infra** | Docker Compose (Postgres local), plataformas gerenciadas (produção) |

## 🛠️ Instalação e Desenvolvimento

### Pré-requisitos

- Node.js 20+
- npm
- Docker (para PostgreSQL local)

### 1. Banco de dados

```bash
cd api
npm run db:up
```

Isso sobe o PostgreSQL via `api/docker-compose.yml`.

### 2. API

```bash
cd api
npm install
cp .env.example .env
npm run start:dev
```

Opcional — popular com dados de exemplo:

```bash
npm run seed
```

- API: `http://localhost:3000`
- Swagger operacional: `http://localhost:3000/docs`
- Swagger backoffice: `http://localhost:3000/docs/admin`

### 3. Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

- App operacional: `http://localhost:5173`
- Backoffice (super admin): `http://localhost:5173/backoffice/login`
- Conecta à API em `http://localhost:3000` (variável `VITE_API_URL`)

> A API precisa estar rodando antes do frontend.

### Autenticação (Maria Borboleta — multi-tenant)

| App | URL | Quem acessa |
|-----|-----|-------------|
| Operacional | `/login` | Admin, gerente ou staff de **uma filial** |
| Backoffice | `/backoffice/login` | **Super admin** apenas |

**Credenciais do seed (dev):**

| Papel | E-mail | Senha |
|-------|--------|-------|
| Super admin | `owner@beautyexpress.com` | `SenhaAdmin123!` |
| Admin Paulista | `admin@paulista.mariaborboleta.com` | `Senha123!` |
| Admin Recife | `admin@recife.mariaborboleta.com` | `Senha123!` |
| Admin Boa Viagem | `admin@boaviagem.mariaborboleta.com` | `Senha123!` |

Reset completo do banco + seed:

```bash
cd api && npm run db:reset && npm run seed
```

### Variáveis de ambiente

**`api/.env`** (veja `.env.example`):

```env
PORT=3000
CORS_ORIGIN=http://localhost:5173
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=beauty_express
DB_SYNCHRONIZE=true
JWT_ACCESS_SECRET=change-me-access-secret
JWT_REFRESH_SECRET=change-me-refresh-secret
THROTTLE_LOGIN_LIMIT=10
THROTTLE_LOGIN_TTL_MS=60000
```

**`frontend/.env`**:

```env
VITE_API_URL=http://localhost:3000
```

## 📦 Funcionalidades

### Agendamentos
- Criação com múltiplos serviços e preços customizados
- **Registro retroativo** — datas passadas exigem serviço + colaborador e concluem automaticamente (gera comissões)
- Conclusão, cancelamento e filtro por data

### Comissões
- Cálculo automático por percentual do colaborador
- Filtros por período, colaborador e status de pagamento
- Marcação em lote como paga/não paga

### Relatórios
- Relatório mensal com totais de receita, comissões e valor líquido

## 🧪 Testes

```bash
cd api
npm test              # 164 testes
npm run test:cov      # Com cobertura
```

## 📚 API

| Documentação | URL |
|--------------|-----|
| Operacional | `http://localhost:3000/docs` |
| Backoffice | `http://localhost:3000/docs/admin` |

### Endpoints principais

| Recurso | Exemplos |
|---------|----------|
| Auth operacional | `POST /auth/login`, `POST /auth/refresh` |
| Auth backoffice | `POST /auth/admin/login` |
| Admin | `GET /admin/tenants`, `POST /admin/users`, `GET /admin/audit-logs` |
| Colaboradores | `GET/POST /collaborators` |
| Serviços | `GET/POST /services` |
| Agendamentos | `GET/POST /appointments`, `PUT /appointments/:id/complete` |
| Serviços agendados | `POST /scheduled-services/appointment/:id` |
| Comissões | `GET /commissions`, `PUT /commissions/mark-as-paid` |
| Relatórios | `GET /financial-reports/monthly?year=2026&month=6` |

Logins têm rate limit configurável (`THROTTLE_LOGIN_LIMIT` / `THROTTLE_LOGIN_TTL_MS`). Ações do backoffice são registradas em `admin_audit_logs`.

## 🗄️ Banco de Dados

**PostgreSQL 16** com entidades:

- `Collaborator`, `Service`, `Appointment`, `ScheduledService`, `Commission`

Em desenvolvimento, `DB_SYNCHRONIZE=true` cria/atualiza o schema automaticamente. Em produção, use `DB_SYNCHRONIZE=false`.

## 🚀 Implantação

API e frontend são implantados **separadamente**:

- **API** — Railway, Render, Fly.io ou similar + PostgreSQL gerenciado
- **Frontend** — Vercel, Netlify ou CDN (build estático)

Em produção, recomenda-se subdomínios distintos: `app.` (filiais) e `admin.` (backoffice), com `CORS_ORIGIN` listando ambas as origens.

Guia completo: **[docs/DEPLOY.md](./docs/DEPLOY.md)**

## 🔮 Roadmap

Plano de auth e multi-tenant: **[docs/PLANO_AUTH_MULTI_TENANT.md](./docs/PLANO_AUTH_MULTI_TENANT.md)**.

## 📝 Licença

Projeto privado de uso interno.

---

**Beauty Express** — Gestão completa para seu salão de beleza 💅✨
