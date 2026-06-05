# Guia de Implantação — Maria Borboleta

Deploy recomendado via **plataformas gerenciadas** (sem servidor próprio).

## Arquitetura

```
┌─────────────────────┐     HTTPS      ┌─────────────────────┐
│  Frontend (Vite)    │ ─────────────► │  API (NestJS)       │
│  Vercel / Netlify   │                │  Railway / Render   │
│  app.dominio.com    │                │  api.dominio.com    │
└─────────────────────┘                └──────────┬──────────┘
                                                  │
                                       ┌──────────▼──────────┐
                                       │  PostgreSQL         │
                                       │  (Railway, RDS, …)  │
                                       └─────────────────────┘
```

Backoffice (super admin): mesmo frontend, rota `/backoffice/*`. Em produção, pode usar subdomínio `admin.` apontando para o mesmo deploy do frontend.

---

## Pré-requisitos

- Conta em provedor de API (Railway, Render, Fly.io, etc.)
- Conta em provedor de frontend (Vercel, Netlify, etc.)
- PostgreSQL 16+ gerenciado
- Domínio com SSL (geralmente incluso nos provedores)

---

## 1. Banco de dados (PostgreSQL)

Use o Postgres do próprio provedor (Railway, Supabase, Neon, RDS, etc.) e anote:

- Host, porta, usuário, senha, nome do banco
- Se exige SSL (`DB_SSL=true`)

**Desenvolvimento local:**

```bash
cd api && npm run db:up
```

---

## 2. Deploy da API

### 2.1 Railway (passo a passo)

1. **New Project** → adicione **PostgreSQL**
2. Adicione o repositório GitHub como novo serviço
3. No serviço da API → **Settings**:
   - Root Directory: `api`
   - Start Command: `npm run start:prod`
   - **Remova** Pre-deploy command (deixe vazio)
4. No serviço da API → **Variables** → **Raw Editor** → cole (ajuste `Postgres` se o nome do serviço for outro):

```env
DATABASE_URL=${{Postgres.DATABASE_URL}}
```

> A seta no diagrama **não** passa variáveis sozinha. Sem essa linha na aba Variables do serviço da API, o app tenta `localhost:5432` e quebra.

5. Ainda em **Variables**, adicione:

```env
NODE_ENV=production
DB_SYNCHRONIZE=false
JWT_ACCESS_SECRET=...
JWT_REFRESH_SECRET=...
CORS_ORIGIN=https://seu-frontend.up.railway.app
```

6. **Generate Domain** no serviço da API

Pronto. Ao subir, a API conecta no banco via `DATABASE_URL`, roda as migrations e cria as tabelas automaticamente (`NODE_ENV=production`).

### 2.2 Variáveis (outros provedores)

```env
PORT=3000
NODE_ENV=production
CORS_ORIGIN=https://app.seu-dominio.com.br

DATABASE_URL=postgresql://...
DB_SYNCHRONIZE=false
DB_LOGGING=false

JWT_ACCESS_SECRET=...
JWT_REFRESH_SECRET=...
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

THROTTLE_LOGIN_LIMIT=10
THROTTLE_LOGIN_TTL_MS=60000
```

### 2.3 Migrations

Em produção (`NODE_ENV=production`), as migrations rodam **automaticamente** ao iniciar a API. Não precisa de pre-deploy nem comando extra.

Local:

```bash
cd api && npm run migration:run
```

### 2.4 Build e start

No painel do serviço:

| Campo | Valor |
|-------|-------|
| Root directory | `api` |
| Build command | `npm ci && npm run build` |
| Start command | `npm run start:prod` |

Ou via Docker:

```bash
cd api
docker build -t beauty-express-api .
docker run -d -p 3000:3000 --env-file .env beauty-express-api
```

> O `start:prod` carrega `bootstrap-paths` antes do `dist/main.js` (aliases `@common/*`).

### 2.5 Verificar

```bash
curl https://api.seu-dominio.com.br/docs
# Swagger operacional e backoffice: /docs e /docs/admin
```

Rotas operacionais exigem JWT — use login em `/auth/login` para testar com token.

### 2.6 Seed (só primeira vez / staging)

```bash
# Localmente, apontando para o banco de produção/staging
npm run seed
```

**Não rode seed em produção** com credenciais de demo. Crie o super admin manualmente e troque senhas.

---

## 3. Deploy do Frontend

### 3.1 Build

Conecte o repositório ao Vercel ou Netlify:

| Campo | Valor |
|-------|-------|
| Root directory | `frontend` |
| Build command | `npm ci && npm run build` |
| Output directory | `dist` |

### 3.2 Variáveis de ambiente (build time)

```env
VITE_API_URL=https://beauty-express-production-xxxx.up.railway.app
```

> Use sempre com `https://`. Sem o protocolo, o browser monta URL errada (ex.: `/backoffice/seu-dominio.railway.app/...`).
>
> `VITE_*` é injetada no build. Se mudar a URL da API, **rebuild obrigatório**.

### 3.3 SPA / rotas

O projeto já inclui `frontend/vercel.json` (Vercel) e `frontend/public/_redirects` (Netlify) para redirecionar todas as rotas ao `index.html`. Sem isso, `/backoffice/login` retorna 404.

Após alterar, **redeploy obrigatório** do frontend.

Rotas principais:

| Rota | Uso |
|------|-----|
| `/login` | App operacional (filiais) |
| `/backoffice/login` | Super admin (URL não linkada no app) |
| `/*` | Demais páginas |

---

## 4. Backup (PostgreSQL)

Use o backup nativo do provedor (Railway, RDS snapshots, etc.).

Backup manual, se necessário:

```bash
pg_dump -h $DB_HOST -U $DB_USERNAME -d beauty_express > backup_$(date +%Y%m%d).sql
```

---

## 5. Atualização

### API

Redeploy via git push no provedor (ou botão “Redeploy”). O pipeline deve rodar `npm run build` e reiniciar com `npm run start:prod`.

### Frontend

Push no repositório → rebuild automático no Vercel/Netlify.

---

## 6. Troubleshooting

### API não conecta ao banco

- Confirme `DB_HOST`, `DB_SSL=true` se o provedor exige
- Teste: `psql -h $DB_HOST -U $DB_USERNAME -d $DB_DATABASE`

### CORS bloqueando o frontend

- `CORS_ORIGIN` deve listar as URLs exatas do frontend (com `https://`)
- Múltiplas origens separadas por vírgula: app + admin

### Frontend não carrega dados

- Verifique `VITE_API_URL` no painel do provedor e faça rebuild
- No DevTools (Network), confirme que as requisições vão para a API correta

### 401 em todas as rotas operacionais

- Normal sem token. Faça login em `/auth/login` primeiro.

---

## Checklist

- [ ] PostgreSQL provisionado
- [ ] `api/.env` configurado no provedor (`DB_SYNCHRONIZE=false`)
- [ ] Postgres conectado à API no Railway (ou `DATABASE_URL` configurada)
- [ ] JWT secrets definidos (não use valores de dev)
- [ ] API com build + `npm run start:prod`
- [ ] `CORS_ORIGIN` com URLs do frontend (app e admin)
- [ ] Frontend buildado com `VITE_API_URL` correto
- [ ] Backup do Postgres configurado no provedor
- [ ] Credenciais de demo **não** usadas em produção

---

**Última atualização**: Junho 2026
