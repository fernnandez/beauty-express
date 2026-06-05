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

### 2.1 Variáveis de ambiente

Configure no painel do provedor (não commite `.env`):

```env
PORT=3000
NODE_ENV=production
CORS_ORIGIN=https://app.seu-dominio.com.br,https://admin.seu-dominio.com.br

DB_HOST=...
DB_PORT=5432
DB_USERNAME=...
DB_PASSWORD=...
DB_DATABASE=beauty_express
DB_SYNCHRONIZE=false
DB_LOGGING=false
DB_SSL=true

JWT_ACCESS_SECRET=...
JWT_REFRESH_SECRET=...
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

THROTTLE_LOGIN_LIMIT=10
THROTTLE_LOGIN_TTL_MS=60000
```

### 2.2 Build e start

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

### 2.3 Verificar

```bash
curl https://api.seu-dominio.com.br/docs
# Swagger operacional e backoffice: /docs e /docs/admin
```

Rotas operacionais exigem JWT — use login em `/auth/login` para testar com token.

### 2.4 Seed (só primeira vez / staging)

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
VITE_API_URL=https://api.seu-dominio.com.br
```

> `VITE_*` é injetada no build. Se mudar a URL da API, **rebuild obrigatório**.

### 3.3 SPA / rotas

Configure fallback para `index.html` (Vercel e Netlify fazem isso automaticamente para SPAs Vite).

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
- [ ] JWT secrets definidos (não use valores de dev)
- [ ] API com build + `npm run start:prod`
- [ ] `CORS_ORIGIN` com URLs do frontend (app e admin)
- [ ] Frontend buildado com `VITE_API_URL` correto
- [ ] Backup do Postgres configurado no provedor
- [ ] Credenciais de demo **não** usadas em produção

---

**Última atualização**: Junho 2026
