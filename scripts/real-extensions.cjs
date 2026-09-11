// Drives the site in Chromium with the user's REAL browser extensions loaded from
// the local Chrome profile, and reports what reaches the Next dev overlay / console.
// This is the closest a test can get to the user's tab (Bitdefender's desktop
// injection cannot be loaded; it is simulated in sim-extension.cjs instead).
//   PORT=3001 node scripts/real-extensions.cjs [/route ...]
const { chromium } = require('@playwright/test')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')

const port = process.env.PORT ?? '3000'
const routes = process.argv.slice(2).length
  ? process.argv.slice(2)
  : ['/ar', '/en', '/ar/programs/palestine-our-compass']
const SKIP = new Set(['fcoeoabgfenejglbffodgkkbkcdhcgfn']) // Claude in Chrome — not a page-mutating extension

function findExtensions() {
  const base = path.join(os.homedir(), 'Library/Application Support/Google/Chrome')
  if (!fs.existsSync(base)) return []
  const out = new Map()
  for (const profile of fs.readdirSync(base)) {
    const extDir = path.join(base, profile, 'Extensions')
    if (!fs.existsSync(extDir)) continue
    for (const id of fs.readdirSync(extDir)) {
      if (SKIP.has(id)) continue
      const versions = fs
        .readdirSync(path.join(extDir, id))
        .filter((v) => fs.existsSync(path.join(extDir, id, v, 'manifest.json')))
        .sort()
      const v = versions.at(-1)
      if (!v) continue
      const manifest = JSON.parse(
        fs.readFileSync(path.join(extDir, id, v, 'manifest.json'), 'utf8'),
      )
      if (manifest.manifest_version !== 3) continue // MV2 cannot be loaded by current Chromium
      out.set(id, { id, name: manifest.name, dir: path.join(extDir, id, v) })
    }
  }
  return [...out.values()]
}

;(async () => {
  const exts = findExtensions()
  if (!exts.length) {
    console.log('no extensions found in the Chrome profile — nothing to load')
    process.exit(0)
  }
  // Copy to a scratch dir: Chrome refuses to load from a live profile path in some setups.
  const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'jaa-ext-'))
  const dirs = exts.map((e) => {
    const d = path.join(scratch, e.id)
    fs.cpSync(e.dir, d, { recursive: true })
    return d
  })
  console.log('loading ' + exts.length + ' extensions: ' + exts.map((e) => e.name).join(' · '))
  const userData = fs.mkdtempSync(path.join(os.tmpdir(), 'jaa-profile-'))
  const ctx = await chromium.launchPersistentContext(userData, {
    channel: 'chromium',
    headless: true,
    args: ['--disable-extensions-except=' + dirs.join(','), '--load-extension=' + dirs.join(',')],
    viewport: { width: 1280, height: 900 },
  })
  let failures = 0
  for (const route of routes) {
    const page = await ctx.newPage()
    const msgs = []
    page.on('console', (m) => {
      if (m.type() === 'error' || m.type() === 'warning')
        msgs.push(m.type() + ': ' + m.text().split('\n')[0].slice(0, 140))
    })
    page.on('pageerror', (e) => msgs.push('pageerror: ' + e.message.slice(0, 140)))
    page.on('console', async (m) => {
      if (m.type() !== 'error' || !/hydrat/i.test(m.text())) return
      const args = await Promise.all(m.args().map((a) => a.jsonValue().catch(() => '')))
      const lines = args
        .map(String)
        .join('\n')
        .split('\n')
        .filter((l) => /^[+-]\s{2,}/.test(l))
      msgs.push(
        'HYDRATION DIFF (' +
          lines.length +
          ' lines):\n      ' +
          lines
            .slice(0, 40)
            .map((l) => l.trim())
            .join('\n      '),
      )
    })
    await page.goto('http://localhost:' + port + route, { waitUntil: 'networkidle' })
    await page.waitForTimeout(2500)
    const overlay = await page.evaluate(() => {
      const r = document.querySelector('nextjs-portal')?.shadowRoot
      if (!r) return ''
      const label = r.querySelector(
        '[data-nextjs-dialog-header], .nextjs__container_errors_label, h1, h2',
      )
      return label ? (label.textContent ?? '') : ''
    })
    const overlayOpen = /Console Error|Runtime|Unhandled|Error/.test(overlay)
    const relevant = msgs.filter((m) => !/404 \(Not Found\)/.test(m))
    // Warnings are informational (they never open the overlay); errors and an open overlay fail.
    const failing = overlayOpen || relevant.some((m) => /^(error|pageerror|HYDRATION)/.test(m))
    if (failing) failures++
    console.log(
      route +
        ' | overlay open: ' +
        overlayOpen +
        ' | console: ' +
        (relevant.length ? '\n   ' + relevant.join('\n   ') : 'clean'),
    )
    if (overlayOpen) console.log('   overlay text: ' + overlay.replace(/\s+/g, ' ').slice(0, 300))
    await page.close()
  }
  await ctx.close()
  fs.rmSync(scratch, { recursive: true, force: true })
  fs.rmSync(userData, { recursive: true, force: true })
  process.exit(failures ? 1 : 0)
})()
