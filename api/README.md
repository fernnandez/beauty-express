# Beauty Express API

Backend API para sistema de gerenciamento de salão de beleza desenvolvido com NestJS.

## 🏗️ Arquitetura

O projeto segue uma arquitetura em camadas:

```
/api/src
  /application
    /controllers    # Controllers REST
    /dtos          # Data Transfer Objects
  /domain
    /entities      # Entidades TypeORM
    /repositories  # Repositórios concretos (estendem Repository do TypeORM)
    /services      # Serviços de domínio (regras de negócio)
    /modules       # Módulos NestJS por contexto
  /config
    database.config.ts  # Configuração do TypeORM
```

## 📦 Funcionalidades

- **Gerenciamento de Colaboradores**: CRUD de colaboradores com percentual de comissão
- **Catálogo de Serviços**: CRUD de serviços com preços padrão
- **Agendamentos**: Criação, atribuição de colaborador, conclusão e cancelamento
- **Cálculo de Comissões**: Cálculo automático de comissões baseado em percentual do colaborador

## 🚀 Instalação

```bash
cd api
npm install
```

## ⚙️ Configuração

Crie um arquivo `.env` na raiz da pasta `api`:

```env
# Database
DB_TYPE=sqlite
DB_DATABASE=database.sqlite

# Server
PORT=3000

# Swagger
SWAGGER_PATH=api
```

## 🏃 Executando

```bash
# Desenvolvimento
npm run start:dev

# Produção
npm run build
npm run start:prod
```

## 📚 Documentação Swagger

Após iniciar o servidor, acesse:

```
http://localhost:3000/api
```

## 🗄️ Banco de Dados

O projeto utiliza SQLite por padrão. O banco de dados será criado automaticamente na primeira execução.

### Entidades

- **Collaborator**: Colaboradores do salão
- **Service**: Serviços oferecidos
- **Appointment**: Agendamentos
- **Commission**: Comissões calculadas

## 📝 Endpoints Principais

### Collaborators
- `POST /collaborators` - Criar colaborador
- `GET /collaborators` - Listar todos (com busca opcional)
- `GET /collaborators/:id` - Buscar por ID
- `PUT /collaborators/:id` - Atualizar
- `DELETE /collaborators/:id` - Deletar

### Services
- `POST /services` - Criar serviço
- `GET /services` - Listar todos (com busca opcional)
- `GET /services/:id` - Buscar por ID
- `PUT /services/:id` - Atualizar
- `DELETE /services/:id` - Deletar

### Appointments
- `POST /appointments` - Criar agendamento
- `GET /appointments` - Listar todos (com filtro de data opcional)
- `GET /appointments/:id` - Buscar por ID
- `PUT /appointments/:id` - Atualizar
- `PUT /appointments/:id/complete` - Concluir agendamento
- `PUT /appointments/:id/cancel` - Cancelar agendamento

### Scheduled Services
- `POST /scheduled-services/appointment/:appointmentId` - Criar serviço agendado
- `PUT /scheduled-services/:id` - Atualizar serviço agendado
- `PUT /scheduled-services/:id/cancel` - Cancelar serviço agendado

### Commissions
- `GET /commissions` - Listar todas (com filtros opcionais: paid, startDate, endDate, collaboratorId)
- `PUT /commissions/mark-as-paid` - Marcar comissões como pagas
- `PUT /commissions/mark-as-unpaid` - Marcar comissões como não pagas

### Financial Reports
- `GET /financial-reports/monthly?year=2024&month=12` - Relatório mensal

## 🚀 Deploy Local

### Build Completo (Frontend + API)

Para fazer o build completo e iniciar a aplicação:

```bash
# Build completo (instala dependências, builda frontend e API, copia frontend)
npm run build:all

# Iniciar em produção
npm run start:prod
```

### Desenvolvimento Separado

Para desenvolvimento com hot-reload:

```bash
# Terminal 1: API
npm run start:dev

# Terminal 2: Frontend (em outro terminal)
cd ../frontend
npm run dev
```

A API estará em `http://localhost:3000` e o frontend em `http://localhost:5173`

