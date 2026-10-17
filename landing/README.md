# Ageendoo — Landing Page

Landing page de produto do Ageendoo, para envio a leads.

Projeto independente (React 19 + Vite 7 + Mantine 8), deployado separadamente do app operacional e do backoffice.

## Desenvolvimento

```bash
cd landing
npm install
npm run dev     # http://localhost:5173
```

## Build

```bash
npm run build   # typecheck + build em dist/
npm run preview
```

## Branding

Tudo que muda quando o branding final sair está centralizado:

- `src/branding.ts` — nome do produto, número de WhatsApp (placeholder), mensagem, cliente âncora.
- `src/theme.ts` — paleta de cores Mantine (rosa provisório).

Trocar os valores nesses dois arquivos propaga para todas as seções.

## Estrutura

```
src/
  branding.ts        # tokens de conteúdo/CTA
  theme.ts           # tema Mantine
  App.tsx            # compõe as seções
  sections/
    Navbar.tsx
    Hero.tsx
    ProblemSolution.tsx
    Features.tsx     # funcionalidades atuais do sistema
    Roadmap.tsx      # perfil do profissional, WhatsApp (em breve)
    Franchises.tsx   # multi-filial / franquias
    CTA.tsx
    Footer.tsx
```
