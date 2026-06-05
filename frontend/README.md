# Beauty Express — Frontend

SPA em **React 19 + Vite + Mantine 8** para gestão de salão de beleza.

## Tecnologias

- React 19, TypeScript, Vite 7
- Mantine 8 (UI, formulários, datas, notificações)
- TanStack Query (estado do servidor)
- React Router 7
- Axios
- Luxon + dayjs (locale `pt-br`)

## Estrutura

```
src/
├── components/
│   ├── appointment/     # Modais e views de agendamento
│   ├── collaborator/
│   ├── service/
│   └── Layout.tsx
├── config/
│   ├── api.ts           # Cliente Axios
│   └── dates.ts         # Locale pt-br (dayjs)
├── hooks/               # React Query + formulários
├── pages/               # Rotas da aplicação
├── services/            # Chamadas à API
├── utils/               # Datas, erros, formatação
└── constants/           # Mensagens do sistema
```

## Instalação

```bash
npm install
cp .env.example .env
npm run dev
```

App em `http://localhost:5173`.

## Configuração

```env
# URL base da API (sem sufixo /api)
VITE_API_URL=http://localhost:3000
```

A API deve estar rodando e com `CORS_ORIGIN` apontando para o frontend.

## Scripts

```bash
npm run dev       # Desenvolvimento com hot-reload
npm run build     # Build de produção (dist/)
npm run preview   # Preview do build
npm run lint      # ESLint
```

## Páginas

| Rota | Descrição |
|------|-----------|
| `/` | Dashboard com contadores |
| `/collaborators` | CRUD de colaboradores |
| `/services` | CRUD de serviços |
| `/appointments` | Agenda e lista de agendamentos |
| `/commissions` | Comissões com filtros |
| `/financial-reports` | Relatório mensal |

## Funcionalidades

- CRUD completo de colaboradores, serviços e agendamentos
- Agendamentos retroativos (data passada → serviço + colaborador obrigatórios)
- Conclusão e cancelamento de agendamentos
- Comissões com filtros e marcação de pagamento
- Relatórios financeiros por mês
- Notificações centralizadas e tratamento de erros padronizado
- Interface em português (pt-BR)

## Deploy

O frontend é implantado **separadamente** da API:

1. `npm run build` gera a pasta `dist/`
2. Sirva os arquivos estáticos (Nginx, Vercel, Netlify, S3 + CDN, etc.)
3. Configure `VITE_API_URL` com a URL pública da API no momento do build

Guia completo: **[../docs/DEPLOY.md](../docs/DEPLOY.md)**
