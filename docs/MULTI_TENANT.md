# 🏢 Multi-Tenant e White Label - Documentação Técnica

Este documento descreve a arquitetura e implementação planejada para suportar múltiplos tenants (salões) na mesma instalação do Beauty Express, com isolamento completo de dados e personalização de marca (white label).

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Arquitetura](#arquitetura)
3. [Componentes Principais](#componentes-principais)
4. [Implementação](#implementação)
5. [Segurança](#segurança)
6. [White Label](#white-label)
7. [Migração](#migração)

## 🎯 Visão Geral

### O que é Multi-Tenant?

Multi-tenant é uma arquitetura onde uma única instância da aplicação serve múltiplos clientes (tenants), cada um com seus dados completamente isolados. No contexto do Beauty Express, cada salão seria um tenant.

### Benefícios

- **Economia de Recursos**: Uma única instalação serve múltiplos clientes
- **Manutenção Simplificada**: Atualizações aplicadas uma vez beneficiam todos
- **Escalabilidade**: Fácil adicionar novos tenants sem infraestrutura adicional
- **Modelo SaaS**: Permite oferecer o sistema como serviço

### Modelos de Isolamento

O Beauty Express utilizará o modelo **Tenant per Schema** (ou Database per Tenant), onde cada tenant possui seu próprio schema/banco de dados:

```
┌─────────────────────────────────────┐
│      Beauty Express Platform        │
├─────────────────────────────────────┤
│  Tenant 1 → database_tenant1.sqlite │
│  Tenant 2 → database_tenant2.sqlite │
│  Tenant 3 → database_tenant3.sqlite │
│  ...                                 │
└─────────────────────────────────────┘
```

**Vantagens**:
- Isolamento total de dados
- Backup e restore por tenant
- Possibilidade de migrar tenant para outro servidor
- Performance isolada (um tenant não afeta outro)

**Desvantagens**:
- Mais complexo de gerenciar
- Mais recursos por tenant

## 🏗️ Arquitetura

### Diagrama de Alto Nível

```
┌─────────────────────────────────────────────────────────┐
│                    Request Flow                         │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│              Tenant Resolution Layer                    │
│  • Extract tenant from subdomain/header                 │
│  • Validate tenant exists and is active                │
│  • Load tenant configuration                           │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│              Tenant Context Middleware                  │
│  • Inject tenantId into request                        │
│  • Set tenant database connection                      │
│  • Apply tenant-specific configurations                │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│              Application Layer                          │
│  • Controllers (tenant-aware)                          │
│  • Services (tenant-scoped)                            │
│  • Repositories (tenant-filtered)                      │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│              Data Layer                                 │
│  • Tenant Database Connection                          │
│  • Tenant-specific queries                             │
│  • Isolated data access                                │
└─────────────────────────────────────────────────────────┘
```

### Estrutura de Diretórios Planejada

```
api/src/
├── application/
│   ├── controllers/
│   ├── dtos/
│   └── middleware/
│       └── tenant.middleware.ts        # Novo
│
├── domain/
│   ├── entities/
│   │   └── tenant.entity.ts            # Novo
│   ├── repositories/
│   │   └── tenant.repository.ts       # Novo
│   ├── services/
│   │   ├── tenant.service.ts           # Novo
│   │   └── tenant-context.service.ts   # Novo
│   └── modules/
│       └── tenant.module.ts            # Novo
│
├── config/
│   └── tenant-database.config.ts       # Novo
│
└── common/
    └── decorators/
        └── tenant.decorator.ts         # Novo
```

## 🔧 Componentes Principais

### 1. Tenant Entity

```typescript
@Entity('tenants')
export class Tenant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  subdomain: string;

  @Column({ nullable: true })
  customDomain: string;

  @Column('json')
  whiteLabelConfig: {
    logo: string;
    primaryColor: string;
    secondaryColor: string;
    brandName: string;
    favicon: string;
  };

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

### 2. Tenant Context Service

```typescript
@Injectable()
export class TenantContextService {
  private currentTenant: Tenant | null = null;
  private tenantConnection: DataSource | null = null;

  setTenant(tenant: Tenant): void {
    this.currentTenant = tenant;
    this.tenantConnection = this.createTenantConnection(tenant);
  }

  getTenant(): Tenant {
    if (!this.currentTenant) {
      throw new Error('No tenant context set');
    }
    return this.currentTenant;
  }

  getTenantId(): string {
    return this.getTenant().id;
  }

  getConnection(): DataSource {
    if (!this.tenantConnection) {
      throw new Error('No tenant connection available');
    }
    return this.tenantConnection;
  }

  private createTenantConnection(tenant: Tenant): DataSource {
    return new DataSource({
      type: 'sqlite',
      database: `database_${tenant.id}.sqlite`,
      // ... outras configurações
    });
  }
}
```

### 3. Tenant Middleware

```typescript
@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(
    private tenantService: TenantService,
    private tenantContext: TenantContextService,
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const tenantId = this.extractTenantId(req);
    
    if (!tenantId) {
      throw new UnauthorizedException('Tenant not identified');
    }

    const tenant = await this.tenantService.findById(tenantId);
    
    if (!tenant || !tenant.isActive) {
      throw new ForbiddenException('Invalid or inactive tenant');
    }

    this.tenantContext.setTenant(tenant);
    req['tenantId'] = tenant.id;
    
    next();
  }

  private extractTenantId(req: Request): string | null {
    // Opção 1: Via subdomínio
    const host = req.get('host') || '';
    const subdomain = host.split('.')[0];
    
    // Opção 2: Via header customizado
    const tenantHeader = req.get('X-Tenant-Id');
    
    // Opção 3: Via query parameter (apenas para desenvolvimento)
    const tenantQuery = req.query.tenantId as string;
    
    return tenantHeader || tenantQuery || subdomain || null;
  }
}
```

### 4. Tenant-Aware Repository Base

```typescript
export abstract class TenantAwareRepository<T> {
  constructor(
    protected repository: Repository<T>,
    protected tenantContext: TenantContextService,
  ) {}

  async findAll(options?: FindManyOptions<T>): Promise<T[]> {
    return this.repository.find({
      ...options,
      where: {
        ...options?.where,
        tenantId: this.tenantContext.getTenantId(),
      },
    });
  }

  async findById(id: string): Promise<T | null> {
    return this.repository.findOne({
      where: {
        id,
        tenantId: this.tenantContext.getTenantId(),
      } as any,
    });
  }

  async save(entity: Partial<T>): Promise<T> {
    const entityWithTenant = {
      ...entity,
      tenantId: this.tenantContext.getTenantId(),
    };
    return this.repository.save(entityWithTenant as any);
  }
}
```

## 🔒 Segurança

### Princípios de Segurança Multi-Tenant

1. **Isolamento Rigoroso**
   - Validação em múltiplas camadas
   - Middleware sempre verifica tenant
   - Repositories sempre filtram por tenant

2. **Prevenção de SQL Injection**
   - Uso exclusivo de query builders parametrizados
   - Validação de inputs
   - Sanitização de dados

3. **Prevenção de Cross-Tenant Access**
   - Middleware bloqueia acesso não autorizado
   - Validação de tenant em todas as operações
   - Logs de auditoria

4. **Rate Limiting por Tenant**
   - Limites individuais por tenant
   - Prevenção de abuso
   - Monitoramento de uso

### Implementação de Segurança

```typescript
@Injectable()
export class TenantSecurityGuard implements CanActivate {
  constructor(private tenantContext: TenantContextService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const requestedTenantId = request.params.tenantId || request.body.tenantId;
    const currentTenantId = this.tenantContext.getTenantId();

    if (requestedTenantId && requestedTenantId !== currentTenantId) {
      throw new ForbiddenException('Cross-tenant access denied');
    }

    return true;
  }
}
```

## 🎨 White Label

### Configuração de White Label

Cada tenant pode personalizar:

- **Logo**: Upload de logo personalizado
- **Cores**: Cores primária e secundária
- **Nome da Marca**: Nome personalizado
- **Favicon**: Ícone personalizado
- **Domínio**: Domínio próprio (opcional)

### Implementação Frontend

```typescript
// hooks/useTenantConfig.ts
export const useTenantConfig = () => {
  const { data: tenant } = useQuery({
    queryKey: ['tenant-config'],
    queryFn: async () => {
      const response = await api.get('/tenant/config');
      return response.data;
    },
  });

  useEffect(() => {
    if (tenant?.whiteLabelConfig) {
      const { primaryColor, secondaryColor, logo, favicon } = tenant.whiteLabelConfig;
      
      // Aplicar cores
      document.documentElement.style.setProperty('--primary-color', primaryColor);
      document.documentElement.style.setProperty('--secondary-color', secondaryColor);
      
      // Aplicar logo
      const logoElement = document.getElementById('app-logo');
      if (logoElement) logoElement.src = logo;
      
      // Aplicar favicon
      const faviconElement = document.querySelector('link[rel="icon"]');
      if (faviconElement) faviconElement.href = favicon;
    }
  }, [tenant]);

  return tenant;
};
```

## 🔄 Migração

### Estratégia de Migração

Para migrar a aplicação atual para multi-tenant:

1. **Fase 1: Preparação**
   - Adicionar campo `tenantId` em todas as entidades
   - Criar migrations
   - Criar tenant master database

2. **Fase 2: Implementação Core**
   - Implementar Tenant entity
   - Implementar TenantContextService
   - Implementar TenantMiddleware
   - Implementar TenantAwareRepository

3. **Fase 3: Migração de Dados**
   - Criar script de migração
   - Migrar dados existentes para tenant padrão
   - Validar isolamento

4. **Fase 4: White Label**
   - Implementar configuração de white label
   - Implementar upload de assets
   - Implementar aplicação de tema no frontend

### Script de Migração Exemplo

```typescript
// scripts/migrate-to-multi-tenant.ts
async function migrateToMultiTenant() {
  // 1. Criar tenant padrão
  const defaultTenant = await tenantRepository.save({
    name: 'Default Tenant',
    subdomain: 'default',
    isActive: true,
  });

  // 2. Adicionar tenantId em todas as entidades existentes
  await appointmentRepository.update({}, { tenantId: defaultTenant.id });
  await collaboratorRepository.update({}, { tenantId: defaultTenant.id });
  await serviceRepository.update({}, { tenantId: defaultTenant.id });
  // ... outras entidades
}
```

## 📊 Monitoramento

### Métricas por Tenant

- Número de agendamentos
- Número de colaboradores
- Uso de armazenamento
- Requisições por minuto
- Erros por tenant

### Dashboard Administrativo

- Lista de tenants
- Status de cada tenant
- Métricas de uso
- Billing e assinaturas

## 🚀 Roadmap de Implementação

### Fase 1: Fundação ✅
- [x] Arquitetura em camadas
- [x] Repository pattern
- [x] Separação de responsabilidades

### Fase 2: Multi-Tenant Core (Próxima)
- [ ] Tenant entity e migrations
- [ ] Tenant context service
- [ ] Tenant middleware
- [ ] Tenant-aware repositories
- [ ] Testes de isolamento

### Fase 3: White Label
- [ ] Sistema de configuração
- [ ] Upload de assets
- [ ] Aplicação de tema
- [ ] Domínios customizados

### Fase 4: Portal de Gestão
- [ ] Portal administrativo
- [ ] Dashboard de métricas
- [ ] Billing e assinaturas
- [ ] Analytics

---

**Status**: Planejado para implementação futura

**Última atualização**: 2024
