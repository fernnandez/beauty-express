# Beauty Express - Frontend

Frontend desenvolvido com React + Vite + Mantine para o sistema de gestão de salão de beleza.

## Tecnologias

- **React 19** - Biblioteca JavaScript para construção de interfaces
- **Vite** - Build tool e dev server
- **Mantine** - Biblioteca de componentes UI
- **React Query** - Gerenciamento de estado do servidor
- **React Router** - Roteamento
- **Axios** - Cliente HTTP
- **TypeScript** - Tipagem estática

## Estrutura do Projeto

```
src/
├── components/       # Componentes reutilizáveis
│   └── Layout.tsx   # Layout principal com navegação
├── config/          # Configurações
│   └── api.ts      # Configuração do Axios
├── hooks/          # Custom hooks do React Query
│   ├── useCollaborators.ts
│   ├── useServices.ts
│   ├── useAppointments.ts
│   └── useCommissions.ts
├── pages/          # Páginas da aplicação
│   ├── Dashboard.tsx
│   ├── Collaborators.tsx
│   ├── Services.tsx
│   ├── Appointments.tsx
│   └── Commissions.tsx
├── services/       # Services para comunicação com API
│   ├── collaborator.service.ts
│   ├── service.service.ts
│   ├── appointment.service.ts
│   └── commission.service.ts
├── types/          # Definições de tipos TypeScript
│   └── index.ts
├── App.tsx        # Componente raiz
└── main.tsx       # Entry point
```

## Configuração

1. Instale as dependências:
```bash
npm install
```

2. Configure a URL da API criando um arquivo `.env`:
```
VITE_API_URL=http://localhost:3000
```

3. Inicie o servidor de desenvolvimento:
```bash
npm run dev
```

## Funcionalidades Implementadas

### ✅ Estrutura Base
- [x] Configuração do projeto com Vite + React + TypeScript
- [x] Integração com Mantine UI
- [x] Configuração do React Query
- [x] Estrutura de services para comunicação com API
- [x] Custom hooks para cada módulo
- [x] Layout principal com navegação lateral
- [x] Dashboard inicial com cards de navegação

### ✅ Módulos Básicos
- [x] Colaboradores - Listagem
- [x] Serviços - Listagem
- [x] Agendamentos - Listagem
- [x] Comissões - Listagem

## Próximos Passos

- [ ] Formulários de criação/edição para Colaboradores
- [ ] Formulários de criação/edição para Serviços
- [ ] Formulário de criação de Agendamentos
- [ ] Ações de agendamento (completar, cancelar, atribuir colaborador)
- [ ] Cálculo de comissões
- [ ] Filtros e busca nas listagens
- [ ] Paginação
- [ ] Validação de formulários
- [ ] Tratamento de erros
- [ ] Loading states
- [ ] Notificações de sucesso/erro

## Padrões Adotados

- **Componentização**: Componentes reutilizáveis e bem organizados
- **Estilos**: Uso direto dos componentes do Mantine (sem CSS customizado)
- **State Management**: React Query para estado do servidor
- **Type Safety**: TypeScript em todo o projeto
- **Service Layer**: Separação de lógica de API em services
- **Custom Hooks**: Hooks personalizados para encapsular lógica do React Query
