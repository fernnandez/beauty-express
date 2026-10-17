// @ts-check
/**
 * Captura screenshots reais do app (perfil admin) para o Manual interno.
 *
 * Pré-requisitos (ambiente dev de pé):
 *   - API em http://localhost:3000   (cd api && npm run start:dev)
 *   - Frontend em http://localhost:5173 (cd frontend && npm run dev)
 *   - Seed aplicado                   (cd api && npm run seed)
 *
 * Uso: node scripts/capture-manual.mjs
 * Saída: frontend/public/manual/*.png  (nomes batem com os <Shot src=.../>)
 */
import { chromium } from "playwright";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { mkdirSync } from "node:fs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, "..", "public", "manual");
mkdirSync(OUT_DIR, { recursive: true });

const BASE = process.env.MANUAL_BASE_URL || "http://localhost:5173";
const EMAIL = process.env.MANUAL_EMAIL || "admin@paulista.mariaborboleta.com";
const PASSWORD = process.env.MANUAL_PASSWORD || "Senha123!";
// Colaboradora Maria Silva (seed) — usada no print do perfil do colaborador.
const COLLABORATOR_ID = "a0000001-0001-4000-8000-000000000001";

const VIEWPORT = { width: 1440, height: 900 };

/** Esconde o banner vermelho de ambiente de desenvolvimento. */
const HIDE_DEV_BANNER_CSS = `
  header[style*="e03131"],
  header[style*="224, 49, 49"] { display: none !important; }
  main, .mantine-AppShell-main { padding-top: 0 !important; }
`;

/** rota -> arquivo (nome usado nos componentes <Shot/>) + espera opcional */
const SHOTS = [
  { path: "/", file: "dashboard.png", waitText: null },
  { path: "/appointments", file: "agendamentos.png", waitText: "Agendamentos" },
  { path: "/services", file: "servicos.png", waitText: "Servi" },
  { path: "/collaborators", file: "colaboradores.png", waitText: "Colaborador" },
  {
    path: `/collaborators/${COLLABORATOR_ID}`,
    file: "perfil-colaborador.png",
    waitText: null,
  },
  { path: "/expenses", file: "despesas.png", waitText: "Despesa" },
  { path: "/financial-reports", file: "relatorios.png", waitText: "Relat" },
  { path: "/settings", file: "configuracoes.png", waitText: "Configura" },
];

async function prepare(page) {
  await page.addStyleTag({ content: HIDE_DEV_BANNER_CSS });
  await page.evaluate(() => window.scrollTo(0, 0));
}

async function main() {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();

  console.log("→ login");
  await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
  await page.getByLabel("E-mail").fill(EMAIL);
  await page.getByLabel("Senha").fill(PASSWORD);
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.waitForURL((url) => !url.pathname.startsWith("/login"), {
    timeout: 15000,
  });
  await page.waitForTimeout(1500);
  console.log("✓ logado:", page.url());

  for (const shot of SHOTS) {
    console.log(`→ ${shot.path} -> ${shot.file}`);
    await page.goto(`${BASE}${shot.path}`, { waitUntil: "networkidle" });
    if (shot.waitText) {
      try {
        await page
          .getByText(new RegExp(shot.waitText, "i"))
          .first()
          .waitFor({ timeout: 8000 });
      } catch {
        console.warn(`  (aviso: "${shot.waitText}" não encontrado)`);
      }
    }
    await page.waitForTimeout(1000);
    await prepare(page);
    await page.screenshot({
      path: join(OUT_DIR, shot.file),
      fullPage: false,
    });
  }

  await browser.close();
  console.log("✓ prints salvos em", OUT_DIR);
}

main().catch((err) => {
  console.error("ERRO na captura:", err);
  process.exit(1);
});
