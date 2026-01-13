# 💅 Beauty Express

Sistema completo de gestão para salões de beleza, desenvolvido com foco em agendamentos, controle de colaboradores, serviços e cálculo automático de comissões.

## 📋 Sobre o Projeto

O **Beauty Express** é uma solução completa para gerenciamento de salões de beleza, oferecendo funcionalidades essenciais para o dia a dia do negócio:

- **Gestão de Colaboradores**: Cadastro e controle de profissionais com percentuais de comissão personalizados
- **Catálogo de Serviços**: Gerenciamento completo de serviços oferecidos com preços configuráveis
- **Sistema de Agendamentos**: Criação, edição e controle de agendamentos com múltiplos serviços
- **Cálculo Automático de Comissões**: Sistema inteligente que calcula comissões baseado nos serviços realizados
- **Relatórios Financeiros**: Visualização de relatórios mensais com totais de receita, comissões e valores líquidos

## 📸 Screenshots e Vídeos

### Screenshots

#### Dashboard
![Dashboard](.github/prints/1.png)

#### Agendamentos
![Agendamento](.github/prints/2.png)

#### Criando um Agendamento
![Criando um Agendamento](.github/prints/3.png)

<!-- ### Vídeos -->

<!-- Adicione aqui links para vídeos demonstrativos quando disponíveis -->
<!-- 
- [Demonstração Completa do Sistema](https://youtube.com/...)
- [Tutorial de Uso](https://youtube.com/...)
- [Apresentação das Funcionalidades](https://youtube.com/...)
-->


## 🏗️ Arquitetura

O projeto segue uma arquitetura em camadas (Layered Architecture) com separação clara de responsabilidades:

### Backend (API)

```
/api/src
├── application/          # Camada de Aplicação
│   ├── controllers/      # Controllers REST (endpoints HTTP)
│   ├── dtos/            # Data Transfer Objects (validação e transformação)
│   └── interceptors/    # Interceptors (transformação de dados)
│
├── domain/              # Camada de Domínio
│   ├── entities/        # Entidades do domínio (TypeORM)
│   ├── repositories/   # Repositórios (abstração de acesso a dados)
│   ├── services/        # Serviços de domínio (regras de negócio)
│   └── modules/         # Módulos NestJS por contexto
│
├── config/              # Configurações
│   └── database.config.ts
│
└── utils/               # Utilitários
    └── date.util.ts     # Funções auxiliares para manipulação de datas
```

**Princípios da Arquitetura:**
- **Separação de Responsabilidades**: Cada camada tem uma responsabilidade específica
- **Inversão de Dependências**: Dependências apontam para abstrações
- **Domain-Driven Design**: Foco nas regras de negócio no domínio
- **Repository Pattern**: Abstração da camada de persistência

### Frontend

```
/frontend/src
├── components/          # Componentes React reutilizáveis
│   ├── appointment/    # Componentes de agendamento
│   ├── collaborator/   # Componentes de colaborador
│   ├── service/        # Componentes de serviço
│   └── Layout.tsx      # Layout principal
│
├── pages/              # Páginas da aplicação
│   ├── Dashboard.tsx
│   ├── Collaborators.tsx
│   ├── Services.tsx
│   ├── Appointments.tsx
│   ├── Commissions.tsx
│   └── FinancialReports.tsx
│
├── hooks/              # Custom Hooks (React Query)
│   ├── useCollaborators.ts
│   ├── useServices.ts
│   ├── useAppointments.ts
│   └── useCommissions.ts
│
├── services/           # Services de comunicação com API
│   ├── collaborator.service.ts
│   ├── service.service.ts
│   ├── appointment.service.ts
│   └── commission.service.ts
│
└── types/              # Definições TypeScript
    └── index.ts
```

## 🚀 Tecnologias

### Backend
- **NestJS** - Framework Node.js para aplicações escaláveis
- **TypeORM** - ORM para TypeScript/JavaScript
- **SQLite** - Banco de dados (pode ser facilmente migrado para PostgreSQL/MySQL)
- **TypeScript** - Tipagem estática
- **Jest** - Framework de testes
- **Swagger** - Documentação automática da API

### Frontend
- **React 19** - Biblioteca para construção de interfaces
- **Vite** - Build tool e dev server
- **Mantine** - Biblioteca de componentes UI moderna
- **React Query** - Gerenciamento de estado do servidor
- **React Router** - Roteamento
- **Axios** - Cliente HTTP
- **TypeScript** - Tipagem estática
- **Luxon** - Manipulação de datas

## 📦 Funcionalidades

### 👥 Gestão de Colaboradores
- ✅ Cadastro completo de colaboradores
- ✅ Definição de percentual de comissão por colaborador
- ✅ Ativação/desativação de colaboradores
- ✅ Busca e filtros
- ✅ Associação de colaboradores a serviços específicos

### ✂️ Catálogo de Serviços
- ✅ Cadastro de serviços com preços padrão
- ✅ Descrição detalhada dos serviços
- ✅ Edição e exclusão de serviços
- ✅ Busca por nome
- ✅ Associação de serviços a colaboradores

### 📅 Sistema de Agendamentos
- ✅ Criação de agendamentos com múltiplos serviços
- ✅ Definição de data, horário de início e fim
- ✅ Atribuição de colaboradores aos serviços agendados
- ✅ Preços customizados por agendamento
- ✅ Observações e notas
- ✅ Status: Agendado, Concluído, Cancelado
- ✅ Conclusão e cancelamento de agendamentos
- ✅ Filtro por data
- ✅ Cálculo automático do preço total

### 💰 Sistema de Comissões
- ✅ Cálculo automático de comissões ao concluir serviços
- ✅ Cálculo baseado no percentual do colaborador
- ✅ Controle de pagamento (pago/não pago)
- ✅ Filtros por colaborador, período e status de pagamento
- ✅ Marcação em lote de comissões como pagas
- ✅ Visualização de comissões pendentes

### 📊 Relatórios Financeiros
- ✅ Relatórios mensais detalhados
- ✅ Total de serviços agendados
- ✅ Total de serviços pagos/concluídos
- ✅ Total de serviços não pagos/pendentes
- ✅ Total de comissões pagas
- ✅ Valor líquido (receita - comissões)

## 🛠️ Instalação e Configuração

### Pré-requisitos
- Node.js 18+ 
- npm ou yarn

### Opção 1: Deploy Local (API + Frontend Unificados)

Esta opção compila o frontend e o copia para a API, que serve tudo em uma única aplicação.

#### Processo de Deploy Local

O deploy local consiste em:

1. **Build do Frontend**: Compilar o frontend React para arquivos estáticos
2. **Copy Client**: Copiar os arquivos compilados do frontend para a pasta `api/client/`
3. **Build da API**: Compilar o código TypeScript da API
4. **Start**: Iniciar a aplicação que serve tanto a API quanto o frontend estático

#### Windows

No Windows, você pode criar um arquivo `.bat` com os seguintes comandos:

```batch
@echo off
echo Building Frontend...
cd frontend
call npm ci --include=dev
call npm run build
cd ..

echo Building API...
cd api
call npm ci --production
call npm run build

echo Copying frontend to API client folder...
if exist client rmdir /s /q client
mkdir client
xcopy /E /I /Y ..\frontend\dist\* client\

echo Starting application...
call npm run start:prod
```

Ou execute manualmente:

```bash
# 1. Build do frontend
cd frontend
npm ci --include=dev
npm run build

# 2. Build da API e copiar frontend
cd ../api
npm ci --production
npm run build
npm run copy:client

# 3. Iniciar aplicação
npm run start:prod
```

#### Linux/Mac

```bash
cd api
npm run build:all
npm run start:prod
```

O comando `build:all` executa automaticamente:
1. Build do frontend (`cd ../frontend && npm ci --include=dev && npm run build`)
2. Build da API (`npm ci --production && npm run build`)
3. Cópia do frontend para `api/client/` (`npm run copy:client`)

A aplicação estará disponível em `http://localhost:3000`
- Frontend: `http://localhost:3000`
- API: `http://localhost:3000/api`
- Swagger: `http://localhost:3000/api/docs`

### Opção 2: Desenvolvimento Separado (API + Frontend)

Para desenvolvimento, é recomendado rodar API e frontend separadamente para ter hot-reload.

#### Backend

1. **Instale as dependências:**
```bash
cd api
npm install
```

2. **Configure as variáveis de ambiente:**
Crie um arquivo `.env` na pasta `api`:
```env
# Database
DB_TYPE=sqlite
DB_DATABASE=database.sqlite

# Server
PORT=3000

# Swagger
SWAGGER_PATH=api
```

3. **Execute o seed (opcional):**
```bash
npm run seed
```

4. **Inicie o servidor de desenvolvimento:**
```bash
npm run start:dev
```

A API estará disponível em `http://localhost:3000`
A documentação Swagger estará em `http://localhost:3000/api/docs`

#### Frontend

1. **Instale as dependências:**
```bash
cd frontend
npm install
```

2. **Configure a URL da API:**
Crie um arquivo `.env` na pasta `frontend`:
```env
VITE_API_URL=http://localhost:3000
```

3. **Inicie o servidor de desenvolvimento:**
```bash
npm run dev
```

O frontend estará disponível em `http://localhost:5173` e se conectará automaticamente à API em `http://localhost:3000`

**Nota**: Certifique-se de que a API está rodando antes de iniciar o frontend.

## 🧪 Testes

O projeto possui uma suíte completa de testes automatizados:

### Executar Testes

```bash
# Backend
cd api
npm test              # Executar todos os testes
npm run test:watch    # Modo watch
npm run test:cov      # Com cobertura de código
```

### Cobertura de Testes

- **Statements**: 87.67%
- **Branches**: 97.33%
- **Functions**: 96.42%
- **Lines**: 87.67%

### Estrutura de Testes

- ✅ **162 testes** automatizados
- ✅ Testes unitários para todos os services
- ✅ Testes de integração para todos os controllers
- ✅ Validação de regras de negócio
- ✅ Testes de casos de erro

## 📚 Documentação da API

A documentação completa da API está disponível via Swagger quando o servidor estiver rodando:

```
http://localhost:3000/api
```

### Principais Endpoints

#### Colaboradores
- `POST /collaborators` - Criar colaborador
- `GET /collaborators` - Listar todos (com busca opcional)
- `GET /collaborators/:id` - Buscar por ID
- `PUT /collaborators/:id` - Atualizar
- `DELETE /collaborators/:id` - Deletar

#### Serviços
- `POST /services` - Criar serviço
- `GET /services` - Listar todos (com busca opcional)
- `GET /services/:id` - Buscar por ID
- `PUT /services/:id` - Atualizar
- `DELETE /services/:id` - Deletar

#### Agendamentos
- `POST /appointments` - Criar agendamento
- `GET /appointments` - Listar todos (com filtro de data opcional)
- `GET /appointments/:id` - Buscar por ID
- `PUT /appointments/:id` - Atualizar
- `PUT /appointments/:id/complete` - Concluir agendamento
- `PUT /appointments/:id/cancel` - Cancelar agendamento

#### Serviços Agendados
- `POST /scheduled-services/appointment/:appointmentId` - Criar serviço agendado
- `PUT /scheduled-services/:id` - Atualizar serviço agendado
- `PUT /scheduled-services/:id/cancel` - Cancelar serviço agendado

#### Comissões
- `GET /commissions` - Listar todas (com filtros opcionais: paid, startDate, endDate, collaboratorId)
- `PUT /commissions/mark-as-paid` - Marcar comissões como pagas
- `PUT /commissions/mark-as-unpaid` - Marcar comissões como não pagas

#### Relatórios Financeiros
- `GET /financial-reports/monthly?year=2024&month=12` - Relatório mensal

## 🗄️ Banco de Dados

O projeto utiliza **SQLite** por padrão, mas pode ser facilmente configurado para PostgreSQL, MySQL ou outros bancos suportados pelo TypeORM.

### Entidades Principais

- **Collaborator**: Colaboradores do salão
- **Service**: Serviços oferecidos
- **Appointment**: Agendamentos de clientes
- **ScheduledService**: Serviços agendados (relação entre Appointment e Service)
- **Commission**: Comissões calculadas

## 🚀 Implantação

O Beauty Express foi projetado para ser implantado de forma simples e eficiente em produção, utilizando **PM2** para gerenciamento de processos e a **API servindo o frontend estático**.

### Arquitetura de Implantação

- **API NestJS**: Serve tanto a API REST quanto os arquivos estáticos do frontend
- **PM2**: Gerenciamento de processos com auto-restart e monitoramento
- **Build Unificado**: Frontend compilado e copiado para a pasta `client` da API

### Processo Rápido

```bash
# 1. Build completo (API + Frontend)
cd api
npm run build:all

# 2. Iniciar com PM2
pm2 start ecosystem.config.js

# 3. Configurar para iniciar no boot
pm2 startup
pm2 save
```

### Documentação Completa

Para um guia detalhado de implantação, incluindo:
- Configuração passo a passo
- Configuração de Nginx como proxy reverso
- Configuração de SSL/HTTPS
- Monitoramento e logs
- Backup e atualização
- Troubleshooting

Consulte o documento **[DEPLOY.md](./DEPLOY.md)**.

## 🔮 Roadmap e Funcionalidades Futuras

### Multi-Tenant e White Label

O Beauty Express está sendo preparado para suportar arquitetura multi-tenant e white label, permitindo que múltiplos salões utilizem a mesma instalação com dados completamente isolados e personalização de marca.

#### Visão Geral da Arquitetura Multi-Tenant

A implementação seguirá o padrão **Tenant per Schema** ou **Tenant per Database**, onde cada salão terá seu próprio schema/banco de dados isolado, garantindo:

- **Isolamento Total de Dados**: Cada tenant não acessa dados de outros tenants
- **Segurança**: Separação completa entre organizações
- **Escalabilidade**: Possibilidade de distribuir tenants em diferentes servidores
- **Performance**: Otimizações específicas por tenant

#### Estrutura Planejada

```
┌─────────────────────────────────────────┐
│         Beauty Express Platform         │
│                                         │
│  ┌──────────────────────────────────┐ │
│  │      Tenant Management Layer      │ │
│  │  • Tenant Registration            │ │
│  │  • Tenant Authentication          │ │
│  │  • Tenant Context Resolution      │ │
│  └──────────────────────────────────┘ │
│                                         │
│  ┌──────────────────────────────────┐ │
│  │      Application Layer            │ │
│  │  • Multi-tenant aware services   │ │
│  │  • Tenant-scoped repositories    │ │
│  │  • Tenant middleware             │ │
│  └──────────────────────────────────┘ │
│                                         │
│  ┌──────────────────────────────────┐ │
│  │      Data Layer                  │ │
│  │  • Tenant Database 1             │ │
│  │  • Tenant Database 2             │ │
│  │  • Tenant Database N             │ │
│  └──────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

#### Componentes Principais

1. **Tenant Entity**
   - ID único do tenant
   - Nome da organização
   - Domínio/subdomínio
   - Configurações de white label
   - Status (ativo/inativo)

2. **Tenant Context Middleware**
   - Identificação do tenant via subdomínio ou header
   - Injeção do contexto do tenant em todas as requisições
   - Validação de acesso

3. **Tenant-Aware Repositories**
   - Filtragem automática por tenant
   - Isolamento de queries
   - Prevenção de vazamento de dados entre tenants

4. **White Label Configuration**
   - Logo personalizado
   - Cores e tema
   - Nome da marca
   - Domínio customizado
   - Email templates personalizados

#### Implementação Técnica

**Backend (NestJS)**:
```typescript
// Tenant Entity
@Entity('tenants')
export class Tenant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  subdomain: string;

  @Column('json')
  whiteLabelConfig: {
    logo: string;
    primaryColor: string;
    secondaryColor: string;
    brandName: string;
  };
}

// Tenant Context Decorator
@Injectable()
export class TenantContext {
  currentTenantId: string;
}

// Tenant Middleware
@Injectable()
export class TenantMiddleware implements NestMiddleware {
  async use(req: Request, res: Response, next: NextFunction) {
    const tenantId = this.extractTenantId(req);
    req['tenantId'] = tenantId;
    next();
  }
}

// Tenant-Aware Repository
@Injectable()
export class TenantAwareRepository<T> {
  async find(tenantId: string, options?: FindOptions): Promise<T[]> {
    return this.repository.find({
      ...options,
      where: { ...options?.where, tenantId },
    });
  }
}
```

**Frontend**:
- Detecção automática do tenant via subdomínio
- Carregamento dinâmico de configurações de white label
- Aplicação de tema personalizado por tenant
- Context API para tenant atual

#### Benefícios

1. **Para o Negócio**:
   - Uma única instalação serve múltiplos clientes
   - Redução de custos de infraestrutura
   - Facilidade de manutenção e atualizações
   - Modelo SaaS escalável

2. **Para os Clientes**:
   - Experiência personalizada com sua marca
   - Dados completamente isolados e seguros
   - Domínio próprio (opcional)
   - Preço reduzido comparado a instalação dedicada

#### Fases de Implementação

**Fase 1: Fundação** (Atual)
- ✅ Arquitetura em camadas preparada
- ✅ Separação de responsabilidades
- ✅ Repository pattern implementado

**Fase 2: Multi-Tenant Core** (Próxima)
- [ ] Tenant entity e migrations
- [ ] Tenant context middleware
- [ ] Tenant-aware repositories
- [ ] Tenant authentication
- [ ] Testes de isolamento

**Fase 3: White Label** (Futuro)
- [ ] Sistema de configuração de marca
- [ ] Upload e gerenciamento de logos
- [ ] Sistema de temas personalizados
- [ ] Domínios customizados
- [ ] Email templates personalizados

**Fase 4: Portal de Gestão** (Futuro)
- [ ] Portal administrativo para gerenciar tenants
- [ ] Dashboard de uso por tenant
- [ ] Billing e assinaturas
- [ ] Analytics multi-tenant

#### Considerações de Segurança

- **Isolamento Rigoroso**: Validação em múltiplas camadas
- **SQL Injection Prevention**: Uso de query builders parametrizados
- **Cross-Tenant Access**: Middleware bloqueia acesso não autorizado
- **Audit Logs**: Registro de todas as ações por tenant
- **Rate Limiting**: Limites por tenant para prevenir abuso

#### Documentação Detalhada

Uma documentação completa sobre a implementação de multi-tenant e white label será disponibilizada em `docs/MULTI_TENANT.md` quando a funcionalidade estiver em desenvolvimento.

## 📝 Licença

Este projeto é privado e de uso interno.

---

**Beauty Express** - Gestão completa para seu salão de beleza 💅✨

