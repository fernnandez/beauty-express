# 🚀 Guia de Implantação - Beauty Express

Este documento descreve o processo de implantação do Beauty Express em ambiente de produção, utilizando PM2 para gerenciamento de processos e a API servindo o frontend estático.

## 📋 Pré-requisitos

- Node.js 18+ instalado
- npm ou yarn
- PM2 instalado globalmente (`npm install -g pm2`)
- Acesso ao servidor de produção (Linux recomendado)

## 🏗️ Arquitetura de Implantação

```
┌─────────────────────────────────────────┐
│         Servidor de Produção            │
│                                         │
│  ┌──────────────────────────────────┐  │
│  │         PM2 Process Manager       │  │
│  │                                   │  │
│  │  ┌────────────────────────────┐  │  │
│  │  │   Beauty Express API        │  │  │
│  │  │   (NestJS + Express)       │  │  │
│  │  │                            │  │  │
│  │  │  • API REST (/api/*)       │  │  │
│  │  │  • Frontend Estático (/*)  │  │  │
│  │  │  • Porta: 3000             │  │  │
│  │  └────────────────────────────┘  │  │
│  └──────────────────────────────────┘  │
│                                         │
│  ┌──────────────────────────────────┐  │
│  │      SQLite Database            │  │
│  │      (database.sqlite)          │  │
│  └──────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

## 📦 Passo a Passo da Implantação

### 1. Preparação do Ambiente

#### 1.1 Instalar PM2 Globalmente

```bash
npm install -g pm2
```

#### 1.2 Clonar ou Fazer Upload do Projeto

```bash
# Via Git
git clone <repository-url> beauty-express
cd beauty-express

# Ou fazer upload via FTP/SFTP para o servidor
```

### 2. Build do Frontend

O frontend será compilado e copiado para a pasta `client` dentro da API, que será servida estaticamente.

```bash
cd frontend
npm install
npm run build
```

Isso gerará os arquivos estáticos na pasta `frontend/dist/`.

### 3. Build da API

```bash
cd ../api
npm install --production
npm run build
```

### 4. Copiar Frontend para API

Execute o script que copia o build do frontend para a pasta `client` da API:

```bash
cd api
npm run copy:client
```

Ou execute o build completo que faz tudo de uma vez:

```bash
npm run build:all
```

Este comando:
1. Faz o build da API (`npm run build`)
2. Copia o frontend compilado para `api/client/` (`npm run copy:client`)

### 5. Configuração do Ambiente

Crie um arquivo `.env` na pasta `api` com as configurações de produção:

```env
# Database
DB_TYPE=sqlite
DB_DATABASE=/caminho/absoluto/para/database.sqlite

# Server
PORT=3000
NODE_ENV=production

# Swagger (opcional em produção)
SWAGGER_PATH=api
```

**Importante**: 
- Use caminho absoluto para o banco de dados em produção
- Considere usar PostgreSQL ou MySQL para produção (mais robusto que SQLite)
- Configure variáveis de ambiente adequadas para seu ambiente

### 6. Configuração do PM2

O projeto já inclui um arquivo `ecosystem.config.js` configurado. Verifique e ajuste se necessário:

```javascript
module.exports = {
  apps: [
    {
      name: 'beauty-express-api',
      script: './dist/main.js',
      instances: 1, // ou 'max' para usar todos os CPUs
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
    },
  ],
};
```

### 7. Iniciar a Aplicação com PM2

```bash
cd api
pm2 start ecosystem.config.js
```

Ou use o comando direto:

```bash
pm2 start dist/main.js --name beauty-express-api
```

### 8. Configurar PM2 para Iniciar no Boot

Para que a aplicação inicie automaticamente quando o servidor reiniciar:

```bash
pm2 startup
# Siga as instruções exibidas

pm2 save
```

### 9. Verificar Status

```bash
# Ver status da aplicação
pm2 status

# Ver logs em tempo real
pm2 logs beauty-express-api

# Ver informações detalhadas
pm2 info beauty-express-api

# Ver uso de recursos
pm2 monit
```

## 🔧 Comandos Úteis do PM2

```bash
# Iniciar aplicação
pm2 start ecosystem.config.js

# Parar aplicação
pm2 stop beauty-express-api

# Reiniciar aplicação
pm2 restart beauty-express-api

# Recarregar aplicação (zero downtime)
pm2 reload beauty-express-api

# Deletar aplicação do PM2
pm2 delete beauty-express-api

# Ver logs
pm2 logs beauty-express-api

# Limpar logs
pm2 flush

# Salvar configuração atual
pm2 save

# Listar todas as aplicações
pm2 list

# Monitoramento em tempo real
pm2 monit
```

## 🌐 Configuração de Proxy Reverso (Nginx)

Para produção, recomenda-se usar Nginx como proxy reverso na frente da aplicação:

### Exemplo de Configuração Nginx

```nginx
server {
    listen 80;
    server_name seu-dominio.com.br;

    # Redirecionar HTTP para HTTPS (recomendado)
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name seu-dominio.com.br;

    # Certificados SSL (use Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/seu-dominio.com.br/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/seu-dominio.com.br/privkey.pem;

    # Configurações SSL
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Tamanho máximo de upload
    client_max_body_size 10M;

    # Proxy para a aplicação Node.js
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Cache para arquivos estáticos
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        proxy_pass http://localhost:3000;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

Após configurar, reinicie o Nginx:

```bash
sudo nginx -t  # Testar configuração
sudo systemctl restart nginx
```

## 🔒 Segurança

### Recomendações de Segurança

1. **HTTPS**: Sempre use HTTPS em produção (Let's Encrypt gratuito)
2. **Firewall**: Configure firewall para permitir apenas portas necessárias
3. **Variáveis de Ambiente**: Nunca commite arquivos `.env` no repositório
4. **Backup**: Configure backups regulares do banco de dados
5. **Logs**: Monitore logs regularmente para detectar problemas
6. **Atualizações**: Mantenha dependências atualizadas

### Exemplo de Configuração de Firewall (UFW)

```bash
# Permitir SSH
sudo ufw allow 22/tcp

# Permitir HTTP e HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Ativar firewall
sudo ufw enable
```

## 📊 Monitoramento

### PM2 Monitoring

PM2 oferece monitoramento básico integrado:

```bash
# Monitoramento em tempo real
pm2 monit

# Informações detalhadas
pm2 info beauty-express-api
```

### PM2 Plus (Opcional)

Para monitoramento avançado, considere usar PM2 Plus:

```bash
pm2 link <secret_key> <public_key>
```

### Logs

Os logs são salvos automaticamente. Configure rotação de logs:

```bash
# Instalar pm2-logrotate
pm2 install pm2-logrotate

# Configurar rotação
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
pm2 set pm2-logrotate:compress true
```

## 🔄 Atualização da Aplicação

### Processo de Atualização

1. **Fazer backup do banco de dados:**
```bash
cp api/database.sqlite api/database.sqlite.backup
```

2. **Parar a aplicação:**
```bash
pm2 stop beauty-express-api
```

3. **Atualizar código:**
```bash
git pull origin main  # ou fazer upload dos novos arquivos
```

4. **Instalar dependências:**
```bash
cd api
npm install --production
```

5. **Rebuild:**
```bash
npm run build:all
```

6. **Reiniciar:**
```bash
pm2 restart beauty-express-api
```

7. **Verificar:**
```bash
pm2 logs beauty-express-api
```

## 💾 Backup

### Backup do Banco de Dados

Configure backups automáticos do SQLite:

```bash
# Criar script de backup
cat > /usr/local/bin/backup-beauty-express.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/backups/beauty-express"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR
cp /caminho/para/api/database.sqlite $BACKUP_DIR/database_$DATE.sqlite
# Manter apenas últimos 7 dias
find $BACKUP_DIR -name "database_*.sqlite" -mtime +7 -delete
EOF

chmod +x /usr/local/bin/backup-beauty-express.sh

# Adicionar ao crontab (backup diário às 2h da manhã)
crontab -e
# Adicionar linha:
0 2 * * * /usr/local/bin/backup-beauty-express.sh
```

## 🐛 Troubleshooting

### Aplicação não inicia

```bash
# Verificar logs
pm2 logs beauty-express-api --lines 50

# Verificar se a porta está em uso
netstat -tulpn | grep 3000

# Verificar permissões
ls -la api/dist/main.js
```

### Erro de banco de dados

```bash
# Verificar se o arquivo existe e tem permissões
ls -la api/database.sqlite

# Verificar permissões de escrita
touch api/database.sqlite
```

### Frontend não carrega

```bash
# Verificar se a pasta client existe
ls -la api/client

# Rebuild do frontend
cd frontend
npm run build
cd ../api
npm run copy:client
pm2 restart beauty-express-api
```

## 📝 Checklist de Implantação

- [ ] Node.js 18+ instalado
- [ ] PM2 instalado globalmente
- [ ] Projeto clonado/uploadado no servidor
- [ ] Dependências instaladas (`npm install`)
- [ ] Frontend buildado (`cd frontend && npm run build`)
- [ ] API buildada (`cd api && npm run build`)
- [ ] Frontend copiado para API (`npm run copy:client`)
- [ ] Arquivo `.env` configurado
- [ ] `ecosystem.config.js` ajustado
- [ ] Aplicação iniciada com PM2
- [ ] PM2 configurado para iniciar no boot
- [ ] Nginx configurado (se aplicável)
- [ ] SSL/HTTPS configurado
- [ ] Firewall configurado
- [ ] Backup configurado
- [ ] Monitoramento configurado
- [ ] Testes realizados

## 📞 Suporte

Em caso de problemas durante a implantação, verifique:

1. Logs do PM2: `pm2 logs beauty-express-api`
2. Logs do sistema: `journalctl -u nginx` (se usando Nginx)
3. Status do PM2: `pm2 status`
4. Portas em uso: `netstat -tulpn`

---

**Última atualização**: 2024

