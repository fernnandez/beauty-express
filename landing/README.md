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

- `src/branding.ts` — nome do produto (`Ageendoo`), número/mensagem de WhatsApp, cliente âncora, cor primária.
- `src/theme.ts` — paleta de cores Mantine (rosa `#bc5675`).

Trocar os valores nesses dois arquivos propaga para todas as seções.

## Estrutura

```
src/
  branding.ts        # tokens de conteúdo/CTA (whatsappLink, productName…)
  theme.ts           # tema Mantine
  App.tsx            # compõe as seções na ordem
  components/        # Logo, PhoneFrame, BrowserFrame
  sections/
    Navbar.tsx
    Hero.tsx
    Features.tsx     # funcionalidades reais do sistema
    Demo.tsx         # prints do app em browser frame
    MobileApp.tsx    # app no celular (PWA)
    ClientProof.tsx  # prova social
    FromNotebook.tsx # do caderno para o sistema
    Roadmap.tsx      # próximos passos (WhatsApp, lembretes, etc.)
    Results.tsx
    CTA.tsx
    Footer.tsx
```

## Prints

Imagens de demonstração ficam em `public/demo/` e `public/demo-mobile/`. O script `scripts/capture.mjs` captura telas reais do app (requer o app rodando) — pode precisar de ajuste conforme as rotas/login atuais.

## Deploy

Build estático servido separadamente (ex.: Vercel). Tem `vercel.json` próprio.
