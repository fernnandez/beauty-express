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
- `GET /collaborators` - Listar todos
- `GET /collaborators/:id` - Buscar por ID
- `PUT /collaborators/:id` - Atualizar
- `DELETE /collaborators/:id` - Deletar

### Services
- `POST /services` - Criar serviço
- `GET /services` - Listar todos
- `GET /services/:id` - Buscar por ID
- `PUT /services/:id` - Atualizar
- `DELETE /services/:id` - Deletar

### Appointments
- `POST /appointments` - Criar agendamento
- `GET /appointments` - Listar todos
- `GET /appointments/:id` - Buscar por ID
- `PUT /appointments/:id/assign-collaborator` - Atribuir colaborador
- `PUT /appointments/:id/complete` - Concluir agendamento
- `PUT /appointments/:id/cancel` - Cancelar agendamento

### Commissions
- `POST /commissions/calculate/:appointmentId` - Calcular comissão
- `GET /commissions` - Listar todas
- `GET /commissions/:id` - Buscar por ID
- `GET /commissions/collaborator/:collaboratorId` - Listar por colaborador

