# Guia de Implantação — Beauty Express

Este guia descreve a implantação em produção com **API e frontend separados** e **PostgreSQL**.

## Arquitetura

```
                    ┌─────────────────────────┐
                    │         Nginx           │
                    │   (proxy + SSL)         │
                    └───────────┬─────────────┘
                                │
              ┌─────────────────┴─────────────────┐
              │                                   │
              ▼                                   ▼
   ┌──────────────────────┐          ┌──────────────────────┐
   │  Frontend (estático) │          │   API (NestJS)       │
   │  app.dominio.com.br  │          │  api.dominio.com.br  │
   │  dist/ via Nginx     │          │  PM2 :3000           │
   └──────────────────────┘          └──────────┬───────────┘
                                                │
                                     ┌──────────▼───────────┐
                                     │     PostgreSQL         │
                                     │  (RDS, Railway, etc.)  │
                                     └────────────────────────┘
```

## Pré-requisitos

- Node.js 20+
- PM2 (`npm install -g pm2`)
- PostgreSQL 16+ (gerenciado ou self-hosted)
- Nginx (recomendado)
- Domínio com SSL (Let's Encrypt)

---

## 1. Banco de dados (PostgreSQL)

### Opção A — Serviço gerenciado

Use Railway, Render, Supabase, AWS RDS ou similar. Anote:

- Host, porta, usuário, senha, nome do banco
- Se exige SSL (`DB_SSL=true`)

### Opção B — Docker no servidor

```bash
docker compose up -d postgres
```

---

## 2. Deploy da API

### 2.1 Preparar o servidor

```bash
git clone <repository-url> beauty-express
cd beauty-express/api
npm ci --production
```

### 2.2 Configurar `.env`

```env
PORT=3000
NODE_ENV=production
CORS_ORIGIN=https://app.seu-dominio.com.br

DB_HOST=seu-host-postgres
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=sua-senha-segura
DB_DATABASE=beauty_express
DB_SYNCHRONIZE=false
DB_LOGGING=false
DB_SSL=true
```

### 2.3 Build e PM2

```bash
npm run build
pm2 start ecosystem.config.js
pm2 startup
pm2 save
```

Ajuste `CORS_ORIGIN` no `ecosystem.config.js` se necessário.

### 2.4 Docker (alternativa)

```bash
cd api
docker build -t beauty-express-api .
docker run -d \
  -p 3000:3000 \
  --env-file .env \
  --name beauty-express-api \
  beauty-express-api
```

### 2.5 Verificar

```bash
curl https://api.seu-dominio.com.br/collaborators
# Swagger: https://api.seu-dominio.com.br/docs
```

---

## 3. Deploy do Frontend

### 3.1 Build

```bash
cd frontend
npm ci
```

Crie `.env.production` (ou exporte antes do build):

```env
VITE_API_URL=https://api.seu-dominio.com.br
```

```bash
npm run build
```

A pasta `dist/` contém os arquivos estáticos.

### 3.2 Servir com Nginx

```nginx
server {
    listen 443 ssl http2;
    server_name app.seu-dominio.com.br;

    ssl_certificate     /etc/letsencrypt/live/app.seu-dominio.com.br/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/app.seu-dominio.com.br/privkey.pem;

    root /var/www/beauty-express/frontend/dist;
    index index.html;

    # SPA — redireciona rotas para index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache de assets
    location ~* \.(js|css|png|jpg|svg|woff2?)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### 3.3 Outras opções

- **Vercel / Netlify** — conecte o repositório, root `frontend/`, build `npm run build`, output `dist/`
- Defina `VITE_API_URL` nas variáveis de ambiente do provedor

---

## 4. Nginx — API (proxy reverso)

```nginx
server {
    listen 443 ssl http2;
    server_name api.seu-dominio.com.br;

    ssl_certificate     /etc/letsencrypt/live/api.seu-dominio.com.br/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.seu-dominio.com.br/privkey.pem;

    client_max_body_size 10M;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
sudo nginx -t
sudo systemctl restart nginx
```

---

## 5. Comandos PM2

```bash
pm2 status
pm2 logs beauty-express-api
pm2 restart beauty-express-api
pm2 reload beauty-express-api
pm2 monit
```

Rotação de logs:

```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

---

## 6. Backup (PostgreSQL)

```bash
# Backup manual
pg_dump -h $DB_HOST -U $DB_USERNAME -d beauty_express > backup_$(date +%Y%m%d).sql

# Restaurar
psql -h $DB_HOST -U $DB_USERNAME -d beauty_express < backup_20260605.sql
```

Cron diário (exemplo):

```bash
0 2 * * * pg_dump -h localhost -U postgres beauty_express | gzip > /backups/beauty_$(date +\%Y\%m\%d).sql.gz
```

---

## 7. Atualização

### API

```bash
pm2 stop beauty-express-api
git pull
cd api && npm ci --production && npm run build
pm2 restart beauty-express-api
pm2 logs beauty-express-api --lines 30
```

### Frontend

```bash
cd frontend
git pull
npm ci
npm run build
# Copiar dist/ para o servidor web ou redeploy no Vercel/Netlify
```

---

## 8. Troubleshooting

### API não conecta ao banco

```bash
# Testar conexão
psql -h $DB_HOST -U $DB_USERNAME -d $DB_DATABASE

# Verificar variáveis
pm2 env beauty-express-api
```

### CORS bloqueando o frontend

- Confirme `CORS_ORIGIN` com a URL exata do frontend (com `https://`)
- Múltiplas origens: `CORS_ORIGIN=https://app.com,https://www.app.com`

### Frontend não carrega dados

- `VITE_API_URL` é injetada no **build** — alterou a URL? Rebuild obrigatório
- Verifique no DevTools (Network) se as requisições vão para a API correta

### Porta em uso

```bash
lsof -ti :3000 | xargs kill
pm2 restart beauty-express-api
```

---

## Checklist

- [ ] PostgreSQL provisionado e acessível
- [ ] `api/.env` configurado (`DB_SYNCHRONIZE=false` em produção)
- [ ] API buildada e rodando com PM2
- [ ] `CORS_ORIGIN` aponta para o frontend
- [ ] Frontend buildado com `VITE_API_URL` correto
- [ ] Nginx com SSL para API e frontend
- [ ] Backup do Postgres agendado
- [ ] PM2 configurado para iniciar no boot
- [ ] Seed executado (se necessário): `npm run seed`

---

**Última atualização**: Junho 2026
