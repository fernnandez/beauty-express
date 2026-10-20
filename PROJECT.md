# PROJECT.md — Ageendoo

> **Nomenclatura:** o produto se chama **Ageendoo**. Nomes técnicos permanecem como estão: o repositório ainda é `beauty-express`, os pacotes npm (`beauty-express-api`) e o serviço/URL da API no Railway (`beauty-express-production-43cf.up.railway.app`) não mudaram. "Maria Borboleta" passa a ser apenas um dos tenants (clientes) do produto.

Documento de contexto para continuidade de desenvolvimento. Leia isto antes de qualquer tarefa nova.

---

## 1. O que é o projeto

**Ageendoo** — SaaS multi-tenant de gestão para salões/esmalterias/barbearias. Monorepo com API REST e frontend SPA independentes.

| Camada | Stack |
|--------|-------|
| **API** | NestJS 11, TypeORM 0.3, PostgreSQL 16, JWT, Swagger, Jest, WebSocket (socket.io) |
| **Frontend** | React 19, Vite 7 (PWA), Mantine 8, TanStack Query, Axios, React Router 7, socket.io-client |
| **Local** | Docker Compose (`api/docker-compose.yml`) para Postgres |
| **Produção** | API no **Railway**, frontend na **Vercel** |

> Além de `api/` e `frontend/`, o monorepo tem `landing/` (site de divulgação, React/Vite).

### Funcionalidades de negócio

- Colaboradores (serviços associados, ativo/inativo; podem ter login próprio — role `collaborator`)
- Catálogo de serviços (preço padrão, **percentual de comissão por serviço**, descrição)
- Agendamentos (múltiplos serviços, status, registro retroativo)
- Comissões automáticas ao concluir serviços, com regime de período (quinzenal/mensal) e alertas de atraso
- Despesas (fixas/recorrentes e esporádicas, por categoria)
- Relatórios financeiros (receita, comissões, despesas e **lucro líquido**)
- Central de ajuda/manual embutida no app
- Atendimento via WhatsApp (**em desenvolvimento — ver seção 14; apenas na branch `feat/whatsapp`, ainda não em produção**)

---

## 2. Produção atual (Out/2026)

| Serviço | URL / provedor |
|---------|----------------|
| Frontend | `https://mariaborboleta.fernnandez.com` |
| Login operacional | `https://mariaborboleta.fernnandez.com/login` |
| Backoffice | `https://mariaborboleta.fernnandez.com/backoffice/login` |
| API | `https://beauty-express-production-43cf.up.railway.app` (Railway) |
| Banco | PostgreSQL no mesmo projeto Railway |

Tenants em produção: um tenant de testes **"Ageendoo"** e o tenant real **"Maria Borboleta - Aurora Paulista"**. (Senhas de produção não ficam documentadas.)

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
| **Operacional** | `/login`, `/`, `/appointments`, … | `admin` ou `collaborator` de **um tenant** |
| **Backoffice** | `/backoffice/login`, `/backoffice/*` | **super_admin** apenas |

No app operacional, `OperationalEntry` escolhe a experiência pelo papel:
- `admin` → app de gestão completo (`AdminApp`)
- `collaborator` → visão mobile enxuta (`CollaboratorApp`: própria agenda + comissões)

Sessões **isoladas** no frontend:
- Operacional: `authStorage` (`beauty_express_*` no localStorage)
- Backoffice: `adminAuthStorage` (`beauty_express_admin_*` no localStorage)

---

## 4. Decisões técnicas importantes

### Multi-tenant

- **Estratégia:** banco único + coluna `tenantId` em entidades de negócio
- **Tenant** = cliente/estabelecimento (slug único: `paulista`, `recife`, `boaviagem`, `barbearia-lucas`, …)
- Isolamento via `TenantContextService` (scope REQUEST) + repositórios que filtram por `tenantId`
- **Super admin** tem `tenantId = null` e **não** acessa rotas operacionais (`TenantGuard` bloqueia)
- Customização por tenant (branding, regras de período/comissão, respostas rápidas) vive em `tenants.settings` (jsonb). **O conceito de "portal" foi removido** (migration `1783000000000-RemovePortals` dropou a tabela `portals` e a coluna `tenants.portalId`): a aplicação é única (Ageendoo) e a personalização acontece só após o login.

### Autenticação

- JWT access (15m) + refresh token (7d), armazenados em `refresh_tokens` (hash SHA-256)
- Dois audiences: `operational` e `admin` (refresh tokens separados)
- Login operacional: e-mail + senha → resolve o tenant pelo `tenantId` do usuário (**sem** seleção de filial/portal no login)
- Login backoffice: `POST /auth/admin/login` → só `super_admin`
- Guards globais: `JwtAuthGuard`, `RolesGuard`, `TenantGuard`
- Rotas públicas: decorator `@Public()`
- Admin: `SuperAdminGuard` + prefixo `/admin/*`
- Rate limit nos logins: `@nestjs/throttler`
- Auditoria admin: tabela `admin_audit_logs`

### Usuários

- **Não há campo `name`** — só `email`, `role`, `tenantId`, `collaboratorId`, `isActive`
- Roles: `super_admin`, `admin`, `collaborator` (`api/src/domain/entities/user-role.enum.ts`). Os antigos `manager`/`staff` foram consolidados em `admin`/`collaborator` pela migration `1784000000000-MigrateUserRoles`.
- `collaboratorId` (migration `1785000000000-AddUserCollaboratorId`): vincula a conta de login a um registro de `collaborators`. Um usuário `collaborator` loga com a própria conta e vê apenas a própria agenda e comissões.
- Unique: `(email, tenantId)` — super_admin usa `tenantId = null`

### Comissões e regime de período

- `commissionPercentage` por **serviço**; a comissão é gerada automaticamente ao concluir o `scheduled_service`
- Regime de período em `tenants.settings.features`: `periodMode` (`'biweekly'` quinzenal — default — ou `'monthly'`) e `commissionPayoutDays` (override opcional dos dias de vencimento). Há alertas de comissão atrasada. Ver `api/src/domain/types/tenant-settings.types.ts` e `tenant-settings.util.ts`.
- `financialReportsMode` (`'full'` | `'revenue_only'`) e `commissionsEnabled` também vivem em `settings.features`

### Despesas e relatórios

- Entidade `expenses` (tipos `one_time`/`recurring`, categorias em `expense-enums.ts`)
- Relatório financeiro agrega **receita, comissões, despesas e lucro líquido** (`netAmount` = receita − comissões − despesas); endpoints `monthly`, `period`, `timeseries`, `top-services`

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
- **PWA**: instalável via `vite-plugin-pwa` (`frontend/vite.config.ts`, `registerType: 'autoUpdate'`, manifest "Ageendoo"). Service worker gerado só no build; há prompt de instalação (`PwaInstallPrompt`).
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
| `tenants` | global | slug, name, isActive, `settings` (jsonb: branding + features) |
| `users` | global | email, passwordHash, role, tenantId (null = super_admin), `collaboratorId` |
| `refresh_tokens` | global | userId, tokenHash, audience, expiresAt |
| `admin_audit_logs` | global | actorUserId, action, entityType, metadata (jsonb) |
| `collaborators` | tenant | name, phone, area, isActive (**sem** campo de comissão) |
| `services` | tenant | defaultPrice, `commissionPercentage`, description |
| `appointments` | tenant | status: agendado/concluido/cancelado |
| `scheduled_services` | tenant | price decimal, status: pendente/concluido/cancelado |
| `commissions` | tenant | unique em scheduledServiceId |
| `collaborator_services` | join | M:N colaborador ↔ serviço |
| `clients` | tenant | name, phone, phoneNormalized |
| `expenses` | tenant | description, category, amount, type (one_time/recurring), date/dayOfMonth/startDate/endDate, isActive |

As tabelas `whatsapp_instances`, `whatsapp_conversations` e `whatsapp_messages` existem apenas na branch `feat/whatsapp` — ver seção 14.

> **Comissão por serviço:** o campo `commissionPercentage` vive em `services` (migration `1785000000000-MoveCommissionToService`). A antiga tabela `collaborator_commission_rates` e a coluna `scheduled_services.commissionRateId` foram removidas; colaboradores não têm mais campo de comissão.

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
  seed.ts          # tenants demo + usuários + dados ricos (reset global)
  seed-tenant.ts   # seed LEVE escopado em um tenant (sem reset/synchronize/truncate global)
  reset-db.ts
  db-reset.util.ts
  change-super-admin-password.ts
migrations/
bootstrap-paths.ts
main.ts
```

### Frontend (`frontend/src/`)

```
pages/             # App operacional (Dashboard, Appointments, Collaborators,
                   #   Services, Clients, Expenses, FinancialReports, Settings,
                   #   Whatsapp, manual/*)
collaborator/      # CollaboratorApp — visão mobile do profissional (agenda + comissões)
backoffice/
  pages/           # Dashboard, Tenants, Users, AdminLogin
  components/      # BackofficeLayout
  hooks/
components/        # Modais, listas por domínio, PwaInstallPrompt, LoginThemeProvider
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
| Negócio | `/collaborators`, `/services`, `/appointments`, `/scheduled-services`, `/commissions`, `/clients`, `/expenses`, `/settings` |
| Relatórios | `GET /financial-reports/monthly`, `/financial-reports/period`, `/financial-reports/timeseries`, `/financial-reports/top-services` |
| WhatsApp (branch `feat/whatsapp`) | `/whatsapp/*` + webhook público `/webhooks/whatsapp` — ver seção 14 |

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

O seed principal (`npm run seed`) reseta o schema e cria 4 tenants demo — `paulista` ("Espaço Bella"), `recife`, `boaviagem` e `barbearia-lucas` ("Barbearia Lucas") — com dados ricos.

| Papel | E-mail | Senha |
|-------|--------|-------|
| Super admin | `owner@beautyexpress.com` | `SenhaAdmin123!` |
| Admin Paulista | `admin@paulista.mariaborboleta.com` | `Senha123!` |
| Admin Recife | `admin@recife.mariaborboleta.com` | `Senha123!` |
| Admin Boa Viagem | `admin@boaviagem.mariaborboleta.com` | `Senha123!` |
| Admin Barbearia | `admin@barbearia.fernnandez.com` | `Senha123!` |

> Seed leve por tenant (`seed-tenant.ts`): não reseta schema nem faz truncate global, só repopula o tenant informado. Não há script npm dedicado; rode via ts-node:
> ```bash
> cd api && SEED_TENANT_ID=<uuid> npx ts-node -r tsconfig-paths/register src/scripts/seed-tenant.ts
> ```

### Testes

```bash
cd api && npm test   # ~293 testes (24 arquivos .spec.ts)
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

> WhatsApp (branch `feat/whatsapp`): `npm run evolution:up` / `evolution:down` / `evolution:logs` sobem a stack da Evolution API (via `api/docker-compose.evolution.yml`) — ver seção 14.

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
| Entidade nova sem migration | `DB_SYNCHRONIZE=true` em dev cria a tabela automaticamente e mascara a falta da migration (ex.: `expenses`) | Sempre gerar a migration (`migration:generate`) **antes** de ir para produção, onde `synchronize=false` |

---

## 11. Backlog / pendências conhecidas

Itens do plano (`docs/PLANO_AUTH_MULTI_TENANT.md`) ainda não implementados ou parciais:

- [ ] Dashboard backoffice com métricas reais cross-filial (stats básicas existem)
- [ ] Endpoints admin para ver dados de tenant específico (`/admin/tenants/:id/appointments`, etc.)
- [x] Seed leve escopado por tenant (`seed-tenant.ts`) — feito
- [ ] CI/CD (GitHub Actions)
- [ ] `docs/MULTI_TENANT.md` e `docs/PLANO_AUTH_MULTI_TENANT.md` desatualizados vs implementação real (ex.: ainda citam `manager`/`staff` e portais)
- [ ] Migration da tabela `expenses` existe (`1785500000000`); confirmar que roda em produção antes do próximo deploy

### Débitos técnicos / segurança

- [ ] JWT secrets com fallback fraco em dev (`jwt.config.ts`) — ok em dev, perigoso se `NODE_ENV` errado
- [ ] Swagger público em produção (`/docs`, `/docs/admin`)
- [ ] `createScheduledService` não valida se `appointmentId` pertence ao tenant
- [ ] JWT não revalida usuário desativado no banco a cada request
- [ ] Refresh tokens não revogados ao desativar usuário / trocar senha
- [ ] `RolesGuard` + `@Roles()`: controllers sensíveis já restringem a `admin` (ex.: `expenses`, `financial-reports`, `whatsapp`); revisar os demais para garantir que `collaborator` só acesse os próprios dados
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

## 14. WhatsApp / Atendimento — 🚧 EM DESENVOLVIMENTO

> **Status:** existe **apenas na branch `feat/whatsapp`** e **ainda não está em produção**. Documentado aqui para continuidade; não assumir que está no `main` nem no ar.

Módulo de atendimento via WhatsApp usando a **Evolution API** (biblioteca **não oficial**). Cada tenant conecta o próprio número.

**Backend (`api/src`)**
- Entidades/tabelas (migration `1786000000000-AddWhatsappInbox`): `whatsapp_instances` (conexão/instância Evolution por tenant, status disconnected/connecting/connected), `whatsapp_conversations` (chat por contato, vínculo opcional a `clients`, `unreadCount`, prévia da última mensagem) e `whatsapp_messages` (histórico espelhado: direção inbound/outbound, tipo text/image/sticker/… , status pending/sent/delivered/read/failed, `reaction`, `waMessageId` para dedupe).
- Controllers: `whatsapp.controller.ts` (`@Roles(ADMIN)`, prefixo `/whatsapp`) e `whatsapp-webhook.controller.ts` (webhook público validado por `?token=`).
- Tempo real: `whatsapp.gateway.ts` — WebSocket socket.io no namespace **`/whatsapp`**.
- Endpoints principais: `GET/POST /whatsapp/instance`, `GET /whatsapp/instance/qr` (QR de pareamento), `POST /whatsapp/instance/disconnect`, `GET /whatsapp/conversations`, `GET /whatsapp/unread-count`, `POST /whatsapp/conversations/from-client`, `POST /whatsapp/conversations/:id/link`, `GET/POST /whatsapp/conversations/:id/messages`, `POST /whatsapp/conversations/:id/read`, `GET /whatsapp/price-list/preview`, `POST /whatsapp/appointments/:id/confirm`, `POST /whatsapp/messages/:id/react`.

**Frontend (`frontend/src/pages/Whatsapp.tsx`)**
- Inbox (lista de conversas + chat), pareamento por QR, status de entrega (tiquinhos), reações (enviar/receber), recebimento de mídia (figurinha/imagem), buckets de conversa (agendado/cliente/novo contato), busca, iniciar conversa a partir de um cliente, vincular/criar cliente, preparar confirmação de agendamento (preenche o texto no input), catálogo de preços e respostas rápidas configuráveis na engrenagem, badge de não lidas na navegação, atualização em tempo real via WebSocket.

**Respostas rápidas e catálogo** ficam em `tenants.settings.features` (`quickReplies`, `priceList`).

**Infra de dev:** `api/docker-compose.evolution.yml` sobe Evolution API + Postgres + Redis. Scripts: `npm run evolution:up|down|logs`.

**Envs novas (`api/.env`):**
```env
EVOLUTION_API_URL=http://localhost:8080
EVOLUTION_API_KEY=change-me-evolution-apikey
EVOLUTION_WEBHOOK_PUBLIC_URL=http://localhost:3000   # URL pública desta API (túnel em dev)
EVOLUTION_WEBHOOK_TOKEN=change-me-webhook-token      # valida ?token= no webhook
```

> Antes de ir para produção: criar/validar a instância por tenant, expor a URL pública do webhook e proteger o token.

---

**Última atualização:** Outubro 2026
