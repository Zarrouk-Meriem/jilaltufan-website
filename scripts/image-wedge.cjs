/**
 * Regression guard for a Next image-optimizer bug (seen on 16.3.4/16.3.5): when a
 * visitor drops the connection while a *cold* image variant is being generated,
 * the internal upstream fetch never settles and every later request for that
 * variant hangs until the server restarts. Reproduces it with real browsers
 * tearing pages down mid-load, then probes the variants with a timeout.
 *
 *   node scripts/image-wedge.cjs [baseURL]     (default http://localhost:3000)
 *
 * Exit 1 if any variant hangs. Clears <distDir>/cache/images first so variants are cold —
 * set NEXT_DIST_DIR to match the server (`NEXT_DIST_DIR=.next-prod pnpm wedge …`).
 * The pages themselves use SVG logos (served as-is, never optimised), so the browsers
 * open the optimiser URLs directly: that is the request a visitor drops mid-generation.
 * Prefer a production server (`pnpm build && pnpm start`). It works against `next dev`,
 * but restart dev afterwards — the abrupt tear-downs can leave its module graph stale.
 */
const { chromium } = require('@playwright/test')
const fs = require('node:fs')
const path = require('node:path')

const base = (process.argv[2] || process.env.BASE_URL || 'http://localhost:3000').replace(/\/$/, '')
const ACCEPT = 'image/avif,image/webp,*/*;q=0.8'
const IMAGES = ['logo', 'logo-on-dark']
const WIDTHS = [64, 96, 128, 256, 384]
const variant = (img, w) => `${base}/_next/image?url=%2Fbrand%2F${img}.png&w=${w}&q=75`

async function main() {
  const distDir = process.env.NEXT_DIST_DIR || '.next'
  fs.rmSync(path.join(process.cwd(), distDir, 'cache/images'), { recursive: true, force: true })
  const browser = await chromium.launch()
  const worker = async (id) => {
    for (let i = 0; i < 12; i++) {
      const ctx = await browser.newContext({
        viewport: { width: 375 + id * 200, height: 800 },
        deviceScaleFactor: 1 + (i % 3),
      })
      const page = await ctx.newPage()
      const img = IMAGES[(i + id) % IMAGES.length]
      const w = WIDTHS[(i * 3 + id) % WIDTHS.length]
      page.goto(variant(img, w)).catch(() => {})
      await new Promise((r) => setTimeout(r, 20 + ((i * 37 + id * 13) % 100)))
      await ctx.close()
    }
  }
  await Promise.all([0, 1, 2, 3].map(worker))
  await browser.close()

  let hung = 0
  for (const img of IMAGES) {
    for (const w of WIDTHS) {
      const url = variant(img, w)
      const ac = new AbortController()
      const timer = setTimeout(() => ac.abort(), 6000)
      const t0 = Date.now()
      const verdict = await fetch(url, { headers: { Accept: ACCEPT }, signal: ac.signal })
        .then((r) => `${r.status} in ${Date.now() - t0}ms`)
        .catch(() => {
          hung++
          return `HUNG after ${Date.now() - t0}ms`
        })
      clearTimeout(timer)
      console.log(`${img} w=${w}: ${verdict}`)
    }
  }
  if (hung) {
    console.error(`\n${hung} image variant(s) wedged — the optimizer never recovered.`)
    process.exit(1)
  }
  console.log('\nNo wedged variants.')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
