# PROJECT.md — Beauty Express / Maria Borboleta

Documento de contexto para continuidade de desenvolvimento. Leia isto antes de qualquer tarefa nova.

---

## 1. O que é o projeto

Sistema de gestão para **esmalterias Maria Borboleta** (multi-filial). Monorepo com API REST e frontend SPA independentes.

| Camada | Stack |
|--------|-------|
| **API** | NestJS 11, TypeORM 0.3, PostgreSQL 16, JWT, Swagger, Jest |
| **Frontend** | React 19, Vite 7, Mantine 8, TanStack Query, Axios, React Router 7 |
| **Local** | Docker Compose (`api/docker-compose.yml`) para Postgres |
| **Produção** | API no **Railway**, frontend na **Vercel** |

### Funcionalidades de negócio

- Colaboradores (comissão %, serviços associados, ativo/inativo)
- Catálogo de serviços (preço padrão, descrição)
- Agendamentos (múltiplos serviços, status, registro retroativo)
- Comissões automáticas ao concluir serviços
- Relatórios financeiros mensais (receita, comissões, líquido)

---

## 2. Produção atual (Jun/2026)

| Serviço | URL / provedor |
|---------|----------------|
| Frontend | `https://mariaborboleta.fernnandez.com` |
| Login operacional | `https://mariaborboleta.fernnandez.com/login` |
| Backoffice | `https://mariaborboleta.fernnandez.com/backoffice/login` |
| API | `https://beauty-express-production-43cf.up.railway.app` (Railway) |
| Banco | PostgreSQL no mesmo projeto Railway |

### Variáveis críticas em produção

**Vercel (frontend):**
```env
VITE_API_URL=https://beauty-express-production-43cf.up.railway.app
```
Sempre com `https://`. Sem protocolo, o axios monta URL relativa e quebra (ex.: `/backoffice/host.railway.app/...`).

**Railway (API):**
```env
DATABASE_URL=${{Postgres.DATABASE_URL}}
NODE_ENV=production
DB_SYNCHRONIZE=false
CORS_ORIGIN=https://mariaborboleta.fernnandez.com
JWT_ACCESS_SECRET=...
JWT_REFRESH_SECRET=...
```

> A seta entre Postgres e API no painel Railway **não injeta variáveis sozinha**. `DATABASE_URL` precisa estar explicitamente na aba Variables do serviço da API.

---

## 3. Arquitetura

```
beauty-express/
├── api/                    # NestJS — deploy separado (root: api/)
├── frontend/               # React/Vite — deploy separado (root: frontend/)
├── docs/
│   ├── DEPLOY.md           # Guia de implantação
│   ├── PLANO_AUTH_MULTI_TENANT.md  # Plano original (parcialmente implementado)
│   └── MULTI_TENANT.md     # Roadmap antigo — pode estar desatualizado
├── PROJECT.md              # Este arquivo
└── README.md               # Quick start para devs
```

```
┌─────────────────────┐     HTTPS      ┌─────────────────────┐
│  Frontend (Vercel)  │ ─────────────► │  API (Railway)      │
│  SPA React          │                │  NestJS             │
└─────────────────────┘                └──────────┬──────────┘
                                                  │
                                       ┌──────────▼──────────┐
                                       │  PostgreSQL         │
                                       └─────────────────────┘
```

Dois “produtos” no mesmo frontend:

| App | Rota | Quem usa |
|-----|------|----------|
| **Operacional** | `/login`, `/`, `/appointments`, … | admin/manager/staff de **uma filial** |
| **Backoffice** | `/backoffice/login`, `/backoffice/*` | **super_admin** apenas |

Sessões **isoladas** no frontend:
- Operacional: `authStorage` (`beauty_express_*` no localStorage)
- Backoffice: `adminAuthStorage` (`beauty_express_admin_*` no localStorage)

---

## 4. Decisões técnicas importantes

### Multi-tenant

- **Estratégia:** banco único + coluna `tenantId` em entidades de negócio
- **Tenant** = filial (slug único: `paulista`, `recife`, `boaviagem`)
- Isolamento via `TenantContextService` (scope REQUEST) + repositórios que filtram por `tenantId`
- **Super admin** tem `tenantId = null` e **não** acessa rotas operacionais (`TenantGuard` bloqueia)

### Autenticação

- JWT access (15m) + refresh token (7d), armazenados em `refresh_tokens` (hash SHA-256)
- Dois audiences: `operational` e `admin` (refresh tokens separados)
- Login operacional: e-mail + senha → resolve filial pelo `tenantId` do usuário (**sem** seleção de filial no login)
- Login backoffice: `POST /auth/admin/login` → só `super_admin`
- Guards globais: `JwtAuthGuard`, `RolesGuard`, `TenantGuard`
- Rotas públicas: decorator `@Public()`
- Admin: `SuperAdminGuard` + prefixo `/admin/*`
- Rate limit nos logins: `@nestjs/throttler`
- Auditoria admin: tabela `admin_audit_logs`

### Usuários

- **Não há campo `name`** — só `email`, `role`, `tenantId`, `isActive`
- Roles: `super_admin`, `admin`, `manager`, `staff`
- Unique: `(email, tenantId)` — super_admin usa `tenantId = null`

### Banco de dados

| Ambiente | Schema |
|----------|--------|
| Dev | `DB_SYNCHRONIZE=true` (auto) ou `npm run db:reset` + seed |
| Produção | `DB_SYNCHRONIZE=false` + **migrations** |

- Migration inicial: `api/src/migrations/1780683492812-InitialSchema.ts`
- Em produção (`NODE_ENV=production`): `migrationsRun: true` no TypeORM — migrations aplicam ao subir a API
- Conexão aceita, em ordem: `DATABASE_URL`, `DATABASE_PRIVATE_URL`, `DATABASE_PUBLIC_URL`, ou `DB_*` / `PG*` (Railway)

### API — paths e build

- Aliases TypeScript: `@application/*`, `@domain/*`, `@config/*`, `@common/*`
- Produção: `start:prod` = `node -r ./dist/bootstrap-paths.js dist/main` (`bootstrap-paths.ts` registra aliases em runtime)
- `tsconfig.build.json` com `incremental: false` (evita `dist/main` ausente)
- Dockerfile em `api/Dockerfile` — copia `tsconfig.build.json` (obrigatório para `nest build`)
- Swagger separado: `/docs` (operacional) e `/docs/admin` (backoffice)

### Frontend

- `resolveApiBaseUrl()` em `frontend/src/utils/api-url.util.ts` — prefixa `https://` se `VITE_API_URL` vier sem protocolo
- `frontend/vercel.json` — rewrite SPA (`/(.*) → /index.html`) para rotas como `/backoffice/login`
- Valores monetários: PostgreSQL `decimal` vem como **string** no JSON → usar `toMoney()` / `formatPrice()` / `sumMoney()` de `money.util.ts`
- Tema operacional: pink; backoffice: indigo + dark mode

### Deploy

- **Sem PM2** — plataformas gerenciadas apenas
- API e frontend deployados **separadamente**
- Seed de demo **não** deve rodar em produção

---

## 5. Modelo de dados

### Tabelas

| Tabela | Escopo | Notas |
|--------|--------|-------|
| `tenants` | global | slug, name, isActive |
| `users` | global | email, passwordHash, role, tenantId (null = super_admin) |
| `refresh_tokens` | global | userId, tokenHash, audience, expiresAt |
| `admin_audit_logs` | global | actorUserId, action, entityType, metadata (jsonb) |
| `collaborators` | tenant | |
| `services` | tenant | |
| `appointments` | tenant | status: agendado/concluido/cancelado |
| `scheduled_services` | tenant | price decimal, status: pendente/concluido/cancelado |
| `commissions` | tenant | unique em scheduledServiceId |
| `collaborator_services` | join | M:N colaborador ↔ serviço |

### Criar super admin em produção (SQL)

```sql
-- Gerar hash: cd api && node -e "require('bcrypt').hash('SuaSenha', 10).then(console.log)"
INSERT INTO users (id, email, "passwordHash", role, "tenantId", "isActive", "createdAt")
VALUES (gen_random_uuid(), 'seu@email.com', '$2b$10$...', 'super_admin', NULL, true, NOW());
```

---

## 6. Estrutura de código

### API (`api/src/`)

```
application/
  controllers/     # REST (auth, admin, collaborators, services, appointments, …)
  dtos/            # class-validator
  strategies/      # jwt.strategy.ts
domain/
  entities/        # TypeORM
  repositories/    # Queries com tenantId
  services/        # Lógica de negócio (REQUEST scope onde usa tenant)
  modules/
common/
  guards/          # jwt, roles, tenant, super-admin
  decorators/      # @Public(), @Roles(), @CurrentUser()
  filters/         # http-exception.filter
config/
  database.config.ts
  data-source.ts   # CLI TypeORM (migrations)
  jwt.config.ts
  throttle.config.ts
scripts/
  seed.ts          # 3 filiais + usuários demo + dados ricos
  reset-db.ts
  db-reset.util.ts
migrations/
bootstrap-paths.ts
main.ts
```

### Frontend (`frontend/src/`)

```
pages/             # App operacional
backoffice/
  pages/           # Dashboard, Tenants, Users, AdminLogin
  components/      # BackofficeLayout
  hooks/
components/        # Modais, listas por domínio
contexts/          # AuthContext, AdminAuthContext
config/
  api.ts           # Axios operacional + refresh interceptor
  admin-api.ts     # Axios backoffice (sessão separada)
services/          # HTTP por domínio
hooks/             # React Query
utils/             # money.util, api-url.util, error.util
types/
```

---

## 7. Endpoints principais

| Grupo | Rotas |
|-------|-------|
| Auth operacional | `POST /auth/login`, `/auth/refresh`, `/auth/logout`, `GET /auth/me` |
| Auth admin | `POST /auth/admin/login`, `/auth/admin/refresh`, `/auth/admin/logout`, `GET /auth/admin/me` |
| Admin | `GET/POST /admin/tenants`, `PATCH /admin/tenants/:id`, `GET/POST /admin/users`, `PATCH /admin/users/:id`, `GET /admin/dashboard/stats`, `GET /admin/audit-logs` |
| Negócio | `/collaborators`, `/services`, `/appointments`, `/scheduled-services`, `/commissions`, `/financial-reports` |

Todos os endpoints de negócio exigem JWT operacional + `tenantId` no token.

---

## 8. Desenvolvimento local

```bash
# Banco
cd api && npm run db:up

# API
cd api && npm install && cp .env.example .env && npm run start:dev

# Seed (opcional)
cd api && npm run db:reset && npm run seed

# Frontend
cd frontend && npm install && cp .env.example .env && npm run dev
```

| URL local | |
|-----------|--|
| API | http://localhost:3000 |
| Swagger | http://localhost:3000/docs e /docs/admin |
| Frontend | http://localhost:5173 |
| Backoffice | http://localhost:5173/backoffice/login |

### Credenciais seed (só dev)

| Papel | E-mail | Senha |
|-------|--------|-------|
| Super admin | `owner@beautyexpress.com` | `SenhaAdmin123!` |
| Admin Paulista | `admin@paulista.mariaborboleta.com` | `Senha123!` |
| Admin Recife | `admin@recife.mariaborboleta.com` | `Senha123!` |
| Admin Boa Viagem | `admin@boaviagem.mariaborboleta.com` | `Senha123!` |

### Testes

```bash
cd api && npm test   # ~171 testes
```

---

## 9. Comandos úteis

```bash
# API
npm run start:dev
npm run start:prod
npm run seed
npm run db:reset
npm run migration:run          # dev
npm run migration:run:prod       # pós-build, manual
npm run migration:generate -- src/migrations/NomeDaMigration

# Frontend
npm run dev
npm run build
```

---

## 10. Armadilhas já encontradas (não repetir)

| Problema | Causa | Solução |
|----------|-------|---------|
| `ECONNREFUSED 127.0.0.1:5432` no Railway | `DATABASE_URL` ausente no serviço da API | `DATABASE_URL=${{Postgres.DATABASE_URL}}` nas Variables da API |
| 404 em `/backoffice/login` na Vercel | SPA sem fallback | `frontend/vercel.json` com rewrite para `index.html` |
| 405 / URL concatenada no login | `VITE_API_URL` sem `https://` | Usar URL absoluta; `resolveApiBaseUrl()` mitiga |
| Build Docker falha `tsconfig.build.json` | Dockerfile incompleto | Copiar `tsconfig.json` + `tsconfig.build.json` |
| `migration:run` no pre-deploy Railway | Script de dev (ts-node + src/) | Usar migrations automáticas no boot ou `migration:run:prod` |
| Valores `NaN` no frontend | `decimal` da API como string | `money.util.ts` |
| CORS bloqueado | `CORS_ORIGIN` vazio em produção | Definir URL exata do frontend |

---

## 11. Backlog / pendências conhecidas

Itens do plano (`docs/PLANO_AUTH_MULTI_TENANT.md`) ainda não implementados ou parciais:

- [ ] Dashboard backoffice com métricas reais cross-filial (stats básicas existem)
- [ ] Endpoints admin para ver dados de filial específica (`/admin/tenants/:id/appointments`, etc.)
- [ ] Seed demo restrito à filial Paulista (hoje popula as 3)
- [ ] CI/CD (GitHub Actions)
- [ ] `docs/MULTI_TENANT.md` desatualizado vs implementação real

### Débitos técnicos / segurança

- [ ] JWT secrets com fallback fraco em dev (`jwt.config.ts`) — ok em dev, perigoso se `NODE_ENV` errado
- [ ] Swagger público em produção (`/docs`, `/docs/admin`)
- [ ] `createScheduledService` não valida se `appointmentId` pertence ao tenant
- [ ] JWT não revalida usuário desativado no banco a cada request
- [ ] Refresh tokens não revogados ao desativar usuário / trocar senha
- [ ] `RolesGuard` sem `@Roles()` na maioria dos controllers — papéis operacionais equivalentes hoje
- [ ] Tokens no `localStorage` (XSS)
- [ ] Desabilitar Swagger ou proteger em produção

---

## 12. Convenções para novos PRs

1. **Escopo mínimo** — não refatorar fora do pedido
2. **Tenant** — toda entidade/query de negócio deve filtrar por `tenantId`
3. **Auth** — rotas operacionais vs `/admin/*` vs `/auth/admin/*` são mundos separados
4. **Migrations** — nunca `synchronize` em produção; gerar migration para mudanças de schema
5. **Dinheiro** — usar `toMoney` no frontend; `decimal` no Postgres
6. **Testes** — rodar `cd api && npm test` antes de merge
7. **Deploy** — mudou `VITE_*` → rebuild frontend; mudou schema → migration + deploy API
8. **Commits** — só quando o usuário pedir explicitamente

---

## 13. Documentação relacionada

| Arquivo | Conteúdo |
|---------|----------|
| [README.md](./README.md) | Instalação rápida, screenshots, endpoints |
| [docs/DEPLOY.md](./docs/DEPLOY.md) | Railway + Vercel passo a passo |
| [docs/PLANO_AUTH_MULTI_TENANT.md](./docs/PLANO_AUTH_MULTI_TENANT.md) | Plano completo auth/multi-tenant (referência histórica) |

---

**Última atualização:** Junho 2026
