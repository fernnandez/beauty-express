// @ts-check
/**
 * Captura screenshots reais do sistema Beauty Express/Ageendoo rodando localmente.
 *
 * Pré-requisitos (ambiente dev já de pé):
 *   - API em http://localhost:3000 (cd api && npm run start:dev)
 *   - Frontend em http://localhost:5173 (cd frontend && npm run dev)
 *   - frontend/.env com VITE_PORTAL_HOST=mariaborboleta.fernnandez.com
 *   - Seed aplicado (cd api && npm run seed)
 *
 * Uso: node scripts/capture.mjs
 * Saída: landing/public/demo/*.png
 */
import { chromium } from 'playwright'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { mkdirSync } from 'node:fs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT_DIR = join(__dirname, '..', 'public', 'demo')
mkdirSync(OUT_DIR, { recursive: true })

const BASE = 'http://localhost:5173'
const EMAIL = 'admin@paulista.mariaborboleta.com'
const PASSWORD = 'Senha123!'

const VIEWPORT = { width: 1440, height: 900 }

/**
 * CSS injetado para esconder o banner vermelho "AMBIENTE DE DESENVOLVIMENTO"
 * e remover o espaçamento reservado para ele — deixa as telas limpas para a LP.
 */
const HIDE_DEV_BANNER_CSS = `
  header[style*="e03131"],
  header[style*="224, 49, 49"] { display: none !important; }
  /* remove o padding-top reservado para o banner no conteúdo */
  main, .mantine-AppShell-main { padding-top: 0 !important; }
`

async function preparePage(page) {
  // injeta style para esconder o banner de dev
  await page.addStyleTag({ content: HIDE_DEV_BANNER_CSS })
  // garante topo da página (títulos não cortados)
  await page.evaluate(() => window.scrollTo(0, 0))
}


/** Telas a capturar: rota + nome do arquivo + espera opcional */
const SHOTS = [
  { path: '/', file: 'dashboard.png', waitText: null },
  { path: '/appointments', file: 'agenda.png', waitText: 'Agendamentos' },
  { path: '/commissions', file: 'comissoes.png', waitText: 'Comiss' },
  { path: '/collaborators', file: 'colaboradores.png', waitText: 'Colaborador' },
  { path: '/services', file: 'servicos.png', waitText: 'Servi' },
  { path: '/financial-reports', file: 'relatorios.png', waitText: 'Relat' },
]

async function main() {
  const browser = await chromium.launch()
  const context = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: 2, // retina / nitidez
  })
  const page = await context.newPage()

  console.log('→ abrindo /login')
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' })

  // Preenche e-mail e senha
  await page.getByLabel('E-mail').fill(EMAIL)
  await page.getByLabel('Senha').fill(PASSWORD)
  console.log('→ submetendo login')
  await page.getByRole('button', { name: 'Entrar' }).click()

  // Espera sair do /login (redirect para dashboard)
  await page.waitForURL((url) => !url.pathname.startsWith('/login'), {
    timeout: 15000,
  })
  console.log('✓ login OK, url =', page.url())

  // Aguarda a aplicação assentar
  await page.waitForTimeout(1500)

  for (const shot of SHOTS) {
    console.log(`→ capturando ${shot.path} -> ${shot.file}`)
    await page.goto(`${BASE}${shot.path}`, { waitUntil: 'networkidle' })
    if (shot.waitText) {
      try {
        await page
          .getByText(new RegExp(shot.waitText, 'i'))
          .first()
          .waitFor({ timeout: 8000 })
      } catch {
        console.warn(`  (aviso: texto "${shot.waitText}" não encontrado, seguindo)`)
      }
    }
    await page.waitForTimeout(1200)
    await preparePage(page)
    await page.screenshot({ path: join(OUT_DIR, shot.file), fullPage: false })
  }

  // Captura extra: modal "Novo Agendamento" aberto
  try {
    console.log('→ capturando modal Novo Agendamento')
    await page.goto(`${BASE}/appointments`, { waitUntil: 'networkidle' })
    await page.waitForTimeout(800)
    await preparePage(page)
    await page.getByRole('button', { name: /Novo Agendamento/i }).first().click()
    await page.waitForTimeout(1000)
    await preparePage(page)
    await page.screenshot({ path: join(OUT_DIR, 'novo-agendamento.png') })
  } catch (err) {
    console.warn('  (aviso: não consegui abrir o modal de novo agendamento)', err.message)
  }

  // Captura extra: tela de Atendimento (WhatsApp) com uma conversa aberta
  try {
    console.log('→ capturando /whatsapp (inbox)')
    await page.goto(`${BASE}/whatsapp`, { waitUntil: 'networkidle' })
    await page.waitForTimeout(1500)
    await preparePage(page)
    // print do inbox (lista de conversas)
    await page.screenshot({ path: join(OUT_DIR, 'whatsapp.png'), fullPage: false })

    // tenta abrir a primeira conversa para mostrar o chat
    try {
      await page.getByText('Carla Mendes').first().click({ timeout: 4000 })
      await page.waitForTimeout(1200)
      await preparePage(page)
      await page.screenshot({ path: join(OUT_DIR, 'whatsapp-chat.png'), fullPage: false })
    } catch {
      console.warn('  (aviso: não consegui abrir uma conversa; mantém só o inbox)')
    }
  } catch (err) {
    console.warn('  (aviso: não consegui capturar /whatsapp)', err.message)
  }

  await browser.close()
  console.log('✓ capturas salvas em', OUT_DIR)
}

main().catch((err) => {
  console.error('ERRO na captura:', err)
  process.exit(1)
})
