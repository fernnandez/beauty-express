// @ts-check
// Captura prints MOBILE do app (branding Espaço Bella), banner de dev oculto.
import { chromium } from 'playwright'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { mkdirSync } from 'node:fs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT = join(__dirname, '..', 'public', 'demo-mobile')
mkdirSync(OUT, { recursive: true })

const BASE = 'http://localhost:5173'
const HIDE_DEV = `
  header[style*="e03131"], header[style*="224, 49, 49"] { display: none !important; }
  main, .mantine-AppShell-main { padding-top: 16px !important; }
`

const SHOTS = [
  { path: '/', file: 'dashboard.png' },
  { path: '/appointments', file: 'agenda.png' },
  { path: '/commissions', file: 'comissoes.png' },
  { path: '/financial-reports', file: 'relatorios.png' },
]

const b = await chromium.launch()
const ctx = await b.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 3,
  isMobile: true,
  hasTouch: true,
})
const p = await ctx.newPage()
await p.goto(`${BASE}/login`, { waitUntil: 'networkidle' })
await p.getByLabel('E-mail').fill('admin@paulista.mariaborboleta.com')
await p.getByLabel('Senha').fill('Senha123!')
await p.getByRole('button', { name: 'Entrar' }).click()
await p.waitForURL((u) => !u.pathname.startsWith('/login'), { timeout: 15000 })
await p.waitForTimeout(1500)

for (const s of SHOTS) {
  await p.goto(`${BASE}${s.path}`, { waitUntil: 'networkidle' })
  await p.waitForTimeout(1200)
  await p.addStyleTag({ content: HIDE_DEV })
  await p.evaluate(() => window.scrollTo(0, 0))
  await p.waitForTimeout(300)
  await p.screenshot({ path: join(OUT, s.file), fullPage: false })
  console.log('ok', s.file)
}
await b.close()
console.log('salvo em', OUT)
