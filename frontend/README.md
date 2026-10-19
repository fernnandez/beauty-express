# Ageendoo — Frontend

SPA em **React 19 + Vite 7 (PWA) + Mantine 8** para gestão de salões/esmalterias/barbearias.

> O repositório ainda se chama `beauty-express` (nome técnico). O produto é o **Ageendoo**.

## Tecnologias

- React 19, TypeScript, Vite 7 (PWA via `vite-plugin-pwa`)
- Mantine 8 (UI, formulários, datas, notificações, charts)
- TanStack Query (estado do servidor)
- React Router 7
- Axios
- Luxon + dayjs (locale `pt-br`)
- socket.io-client (tempo real — usado no WhatsApp, em desenvolvimento)

## Estrutura

```
src/
├── components/          # UI por domínio (appointment, collaborator, service,
│                        #   expense, commission, report, manual…) + Layout, PWA
├── pages/               # Rotas operacionais (Dashboard, Agendamentos, Clientes,
│                        #   Serviços, Despesas, Relatórios, Configurações, manual/)
├── collaborator/        # Experiência mobile do perfil `collaborator`
├── backoffice/          # Área do super admin (sessão separada)
├── config/
│   ├── api.ts           # Cliente Axios operacional (+ refresh interceptor)
│   └── admin-api.ts     # Cliente Axios do backoffice
├── hooks/               # React Query + formulários
├── services/            # Chamadas à API
├── contexts/            # AuthContext, AdminAuthContext
├── utils/               # money, api-url, phone, datas, erros
└── types/
```

## Instalação

```bash
npm install
cp .env.example .env
npm run dev
```

App operacional em `http://localhost:5173`; backoffice em `/backoffice/login`.

## Configuração

```env
# URL base da API (sempre com http(s)://)
VITE_API_URL=http://localhost:3000
```

A API deve estar rodando e com `CORS_ORIGIN` apontando para o frontend.

## Scripts

```bash
npm run dev       # Desenvolvimento com hot-reload
npm run build     # Build de produção (tsc -b + vite build → dist/)
npm run preview   # Preview do build
npm run lint      # ESLint
```

## Autenticação e perfis

| App | Rota | Quem acessa |
|-----|------|-------------|
| Operacional | `/login` | `admin` ou `collaborator` de um tenant |
| Backoffice | `/backoffice/login` | `super_admin` |

O `collaborator` tem login próprio e vê uma visão mobile enxuta (própria agenda + comissões). Sessões isoladas: `authStorage` (operacional) e `adminAuthStorage` (backoffice).

## Páginas (operacional / admin)

| Rota | Descrição |
|------|-----------|
| `/` | Dashboard com cards de atalho |
| `/collaborators` | Colaboradores (+ conceder acesso/login) |
| `/clients` | Clientes |
| `/services` | Serviços (preço + % de comissão) |
| `/appointments` | Agenda e lista de agendamentos |
| `/financial-reports` | Relatórios (receita, comissões, despesas, lucro líquido) |
| `/expenses` | Despesas fixas e esporádicas |
| `/settings` | Branding, regime de período, dias de pagamento |
| `/manual` | Central de ajuda |

## Funcionalidades

- CRUD de colaboradores, serviços, clientes e agendamentos
- Agendamentos retroativos (data passada → serviço + colaborador obrigatórios)
- Comissões automáticas (percentual do serviço), filtros, pagamento em lote e alertas de atraso
- Regime de período quinzenal/mensal configurável
- Despesas (fixas/esporádicas) e relatórios com lucro líquido + gráficos
- PWA: instalável no celular/desktop, com prompt de instalação
- Tabelas responsivas (viram cards no mobile) e navegação mobile-first
- Interface em português (pt-BR)

## Deploy

Implantado **separadamente** da API:

1. `npm run build` gera `dist/`
2. Sirva os estáticos (Vercel, Netlify, CDN…)
3. Configure `VITE_API_URL` com a URL pública da API **no momento do build**

Guia completo: **[../docs/DEPLOY.md](../docs/DEPLOY.md)**

## Atendimento via WhatsApp — 🚧 em desenvolvimento

A tela de **Atendimento** (`/whatsapp`) e o tempo real por WebSocket existem **apenas na branch `feat/whatsapp`** e ainda não estão em produção.
