# Guia de Deploy no Railway

Este guia explica como fazer deploy da API Beauty Express no Railway, aproveitando o disco persistente para SQLite.

## 📋 Por que Railway?

- ✅ **Disco Persistente**: SQLite funciona perfeitamente com volumes persistentes
- ✅ **Deploy Simples**: Suporta Dockerfile automaticamente
- ✅ **Variáveis de Ambiente**: Fácil configuração
- ✅ **Logs em Tempo Real**: Acompanhe o que está acontecendo
- ✅ **Plano Gratuito**: Generoso para projetos pequenos/médios

## 🚀 Passo a Passo

### 1. Criar Conta no Railway

1. Acesse https://railway.app
2. Faça login com GitHub/GitLab
3. Crie um novo projeto

### 2. Conectar Repositório

1. No dashboard do Railway, clique em **"New Project"**
2. Escolha **"Deploy from GitHub repo"**
3. Selecione seu repositório `beauty-express`
4. Railway detectará automaticamente o Dockerfile

### 3. Configurar Serviço

Railway detectará automaticamente:
- ✅ Dockerfile na pasta `api/`
- ✅ Porta (3000)
- ✅ Comando de start

**Configurações importantes:**

- **Root Directory**: `api` (se o Dockerfile estiver em `api/`)
- **Dockerfile Path**: `api/Dockerfile` (ou apenas `Dockerfile` se já estiver na raiz)

### 4. Configurar Volume Persistente para SQLite

**IMPORTANTE**: Para que o SQLite persista os dados:

1. No serviço criado, vá em **"Settings"**
2. Role até **"Volumes"**
3. Clique em **"Add Volume"**
4. Configure:
   - **Mount Path**: `/app/data`
   - **Volume Name**: `sqlite-data` (ou qualquer nome)

Isso garantirá que o arquivo `database.sqlite` seja salvo em um volume persistente.

### 5. Variáveis de Ambiente

No Railway, vá em **"Variables"** e adicione:

```
NODE_ENV=production
DB_DATABASE=/app/data/database.sqlite
PORT=3000
```

**Nota**: O Railway define `PORT` automaticamente, mas você pode definir um fallback.

### 6. Deploy Automático

- Railway faz deploy automaticamente a cada push no repositório
- Ou clique em **"Deploy"** manualmente

## 📁 Estrutura de Arquivos

Certifique-se de que:
- ✅ `Dockerfile` está em `api/Dockerfile`
- ✅ Pasta `client/` está buildada e commitada em `api/client/`
- ✅ `.dockerignore` está configurado

## 🔧 Configuração do Volume

O Dockerfile já cria o diretório `/app/data`. Com o volume montado:

```
/app/data/database.sqlite  ← Persistente entre deploys
```

### Verificando o Volume

Após o deploy, você pode verificar se o volume está funcionando:

1. Vá em **"Settings"** → **"Volumes"**
2. Verifique se o volume está montado em `/app/data`
3. Os dados do SQLite serão preservados mesmo após novos deploys

## 🌐 Domínio Customizado (Opcional)

Railway fornece um domínio gratuito automaticamente:
- Formato: `seu-projeto.up.railway.app`
- Você pode adicionar domínio customizado nas configurações

## 📊 Monitoramento

Railway oferece:
- ✅ Logs em tempo real
- ✅ Métricas de uso (CPU, RAM, Network)
- ✅ Histórico de deploys

## 🔄 Atualizações

Para atualizar a aplicação:

1. Faça push das mudanças:
   ```bash
   git push
   ```

2. Railway detecta automaticamente e faz redeploy

3. **Importante**: O volume `/app/data` permanece intacto, então seus dados SQLite são preservados!

## ⚙️ Variáveis de Ambiente no Railway

Railway permite definir variáveis de ambiente facilmente:

| Variável | Valor | Descrição |
|----------|-------|-----------|
| `NODE_ENV` | `production` | Ambiente de produção |
| `DB_DATABASE` | `/app/data/database.sqlite` | Caminho do banco SQLite no volume |
| `PORT` | *(auto)* | Porta (Railway define automaticamente) |

## 🆚 Railway vs Render

| Recurso | Railway | Render |
|---------|---------|--------|
| Disco Persistente | ✅ Sim (volumes) | ❌ Não (efêmero) |
| SQLite | ✅ Funciona perfeitamente | ⚠️ Dados perdidos em restart |
| Dockerfile | ✅ Suportado | ✅ Suportado |
| Plano Gratuito | ✅ Generoso | ✅ Disponível |
| Deploy Automático | ✅ Sim | ✅ Sim |

## 🔍 Troubleshooting

### Erro: "Cannot write to database"
- Verifique se o volume está montado em `/app/data`
- Verifique permissões do diretório

### Dados não persistem
- Confirme que o volume está configurado corretamente
- Verifique se `DB_DATABASE` aponta para `/app/data/database.sqlite`

### Build falha
- Verifique os logs no Railway
- Confirme que o Dockerfile está no caminho correto
- Verifique se a pasta `client/` existe

## 📚 Recursos

- [Railway Docs](https://docs.railway.app)
- [Railway Volumes](https://docs.railway.app/storage/volumes)
- [Railway Docker](https://docs.railway.app/deploy/dockerfiles)

## 🎯 Checklist de Deploy

- [ ] Conta criada no Railway
- [ ] Repositório conectado
- [ ] Dockerfile commitado
- [ ] Pasta `client/` buildada e commitada
- [ ] Volume persistente configurado em `/app/data`
- [ ] Variáveis de ambiente configuradas
- [ ] Deploy realizado
- [ ] Logs verificados
- [ ] API testada

---

**Dica**: Railway é perfeito para SQLite porque oferece volumes persistentes. Seus dados serão preservados mesmo após múltiplos deploys e reinicializações!
