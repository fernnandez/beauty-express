# Guia de Migração para PostgreSQL no Render

Este guia explica como migrar do SQLite para PostgreSQL no Render.

## 📋 Por que migrar?

- ✅ **Persistência de dados**: Dados não são perdidos em reinicializações
- ✅ **Melhor performance**: PostgreSQL é mais rápido para consultas complexas
- ✅ **Escalabilidade**: Suporta mais conexões simultâneas
- ✅ **Recursos avançados**: Triggers, views, stored procedures, etc.

## 🚀 Passo a Passo

### 1. Instalar Driver do PostgreSQL

O driver `pg` já foi adicionado ao `package.json`. Execute:

```bash
cd api
npm install
```

### 2. Criar Banco PostgreSQL no Render

1. Acesse https://dashboard.render.com
2. Clique em **"New +"** → **"PostgreSQL"**
3. Configure:
   - **Name**: `beauty-express-db` (ou o nome que preferir)
   - **Database**: `beautyexpress` (ou deixe o padrão)
   - **User**: Será gerado automaticamente
   - **Region**: Escolha a mesma região do seu Web Service
   - **PostgreSQL Version**: 16 (recomendado) ou 15
   - **Plan**: Free (para começar) ou Starter (para produção)

4. Após criar, o Render fornecerá automaticamente a variável `DATABASE_URL`

### 3. Configurar Variáveis de Ambiente no Render

No seu **Web Service** no Render, adicione/atualize as variáveis:

```
NODE_ENV=production
DATABASE_URL=<fornecido automaticamente pelo Render>
```

**Importante**: O Render conecta automaticamente o PostgreSQL ao Web Service e fornece `DATABASE_URL`. Você só precisa garantir que está usando essa variável.

### 4. Atualizar Configuração do Banco

A configuração já foi atualizada em `database.config.ts` para:
- Usar PostgreSQL quando `DATABASE_URL` estiver definido
- Usar SQLite quando `DATABASE_URL` não estiver definido (desenvolvimento local)

### 5. Deploy

1. Faça commit das mudanças:
   ```bash
   git add api/package.json api/src/config/database.config.ts
   git commit -m "feat: add PostgreSQL support"
   git push
   ```

2. O Render fará o deploy automaticamente

3. Na primeira execução, o TypeORM criará todas as tabelas automaticamente (`synchronize: true`)

## 🔄 Migração de Dados (Opcional)

Se você já tem dados no SQLite e quer migrar para PostgreSQL:

### Opção 1: Usar Script de Migração

```bash
# Exportar dados do SQLite para JSON
npm run seed -- --export

# Importar no PostgreSQL (após configurar DATABASE_URL)
npm run seed -- --import
```

### Opção 2: Migração Manual

1. Exporte os dados do SQLite usando uma ferramenta como DB Browser for SQLite
2. Importe no PostgreSQL usando pgAdmin ou psql

### Opção 3: Recriar Dados

Execute o seed script após o deploy:

```bash
# No Render, você pode executar via SSH ou adicionar um script de inicialização
npm run seed
```

## ⚙️ Configuração Atual

A configuração agora detecta automaticamente:

- **Produção com DATABASE_URL**: Usa PostgreSQL
- **Desenvolvimento sem DATABASE_URL**: Usa SQLite

### Exemplo de DATABASE_URL do Render:
```
postgresql://user:password@hostname:5432/database?sslmode=require
```

## 🔒 Segurança

- ✅ SSL habilitado automaticamente em produção
- ✅ Credenciais gerenciadas pelo Render
- ✅ Conexão segura entre serviços

## 📝 Variáveis de Ambiente

### Desenvolvimento Local (SQLite)
```env
NODE_ENV=development
DB_DATABASE=database.sqlite
```

### Produção no Render (PostgreSQL)
```env
NODE_ENV=production
DATABASE_URL=<fornecido pelo Render>
```

## ⚠️ Importante

### Synchronize vs Migrations

Atualmente está usando `synchronize: true`, que:
- ✅ Cria/atualiza tabelas automaticamente
- ⚠️ Pode causar perda de dados em produção se usado incorretamente

**Recomendação para produção**:
1. Use `synchronize: false` após a primeira criação
2. Use migrations do TypeORM para mudanças futuras

Para desabilitar synchronize em produção:

```typescript
synchronize: process.env.NODE_ENV !== 'production',
```

## 🧪 Testando Localmente

Para testar PostgreSQL localmente:

1. Instale PostgreSQL localmente ou use Docker:
   ```bash
   docker run --name postgres-test -e POSTGRES_PASSWORD=test -e POSTGRES_DB=beautyexpress -p 5432:5432 -d postgres:16
   ```

2. Configure variável de ambiente:
   ```bash
   export DATABASE_URL="postgresql://postgres:test@localhost:5432/beautyexpress"
   ```

3. Execute a aplicação:
   ```bash
   npm run start:dev
   ```

## 🔍 Verificando Conexão

Após o deploy, verifique os logs no Render. Você deve ver:
```
[Nest] LOG [InstanceLoader] TypeOrmCoreModule dependencies initialized
```

Se houver erros de conexão, verifique:
- ✅ `DATABASE_URL` está configurada
- ✅ PostgreSQL está rodando no Render
- ✅ Web Service e Database estão na mesma região
- ✅ SSL está habilitado

## 📚 Recursos

- [Render PostgreSQL Docs](https://render.com/docs/databases)
- [TypeORM PostgreSQL](https://typeorm.io/data-source-options#postgres--cockroachdb-data-source-options)
- [PostgreSQL SSL](https://www.postgresql.org/docs/current/libpq-ssl.html)

---

**Nota**: Após migrar, seus dados do SQLite local permanecerão intactos. O PostgreSQL será usado apenas em produção no Render.
